<script lang="ts">
  import { bindSkillCategories, bindActivitySkills, bindSkillPrerequisites, bindUserSkillProgress, bindAvailableUserSkills, bindSession } from "../../data/models.svelte";
  import { onMount } from "svelte";

  const session = bindSession();
  const skillCategories = bindSkillCategories();
  const activitySkills = bindActivitySkills();
  const skillPrerequisites = bindSkillPrerequisites();
  const userSkillProgress = bindUserSkillProgress();
  const availableUserSkills = bindAvailableUserSkills();

  let selectedCategoryId: number | null = null;
  
  type SkillNode = {
    id: number;
    name: string;
    difficulty: number;
    masteryLevel: number;
    isAvailable: boolean;
    x: number;
    y: number;
    connections: Connection[];
  };

  type Connection = {
    source: number;
    target: number;
    requiredMasteryLevel: number;
  };

  let skillNodes: SkillNode[] = [];
  let selectedNode: SkillNode | null = null;
  
  // Canvas dimensions
  let width = 800;
  let height = 600;
  let nodeRadius = 30;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  function initializeGraph() {
    if (!session.currentUser || !session.currentUser.id) {
      return;
    }

    // Filter skills by category if one is selected
    let filteredSkills = selectedCategoryId 
      ? activitySkills.all.filter(skill => skill.categoryId === selectedCategoryId) 
      : activitySkills.all;
    
    // Get all prerequisites for visualization
    const allPrerequisites = skillPrerequisites.all;
    
    // Get user progress for these skills
    const progress = userSkillProgress.getByUser(session.currentUser.id);
    const availableSkills = availableUserSkills.getByUser(session.currentUser.id);
    
    // Create nodes
    skillNodes = filteredSkills.map((skill, index) => {
      // Position nodes in a grid layout
      const columns = Math.ceil(Math.sqrt(filteredSkills.length));
      const x = (index % columns) * (width / columns) + (width / columns / 2);
      const y = Math.floor(index / columns) * (height / columns) + (height / columns / 2);
      
      // Get user progress for this skill
      const userProgress = progress.find(p => p.skillId === skill.id);
      const skillAvailability = availableSkills.find(s => s.skillId === skill.id);
      
      return {
        id: skill.id,
        name: skill.name,
        difficulty: skill.difficulty,
        masteryLevel: userProgress?.masteryLevel || 0,
        isAvailable: skillAvailability?.isAvailable === 1,
        x,
        y,
        connections: []
      };
    });
    
    // Add connections (prerequisites)
    allPrerequisites.forEach(prereq => {
      const sourceNode = skillNodes.find(node => node.id === prereq.prerequisiteSkillId);
      const targetNode = skillNodes.find(node => node.id === prereq.skillId);
      
      if (sourceNode && targetNode) {
        targetNode.connections.push({
          source: sourceNode.id,
          target: targetNode.id,
          requiredMasteryLevel: prereq.requiredMasteryLevel
        });
      }
    });
    
    // Draw the graph on next tick after DOM update
    setTimeout(renderGraph, 0);
  }
  
  function renderGraph() {
    if (!canvas) return;
    
    ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw connections first (so they appear under the nodes)
    skillNodes.forEach(node => {
      node.connections.forEach(connection => {
        const sourceNode = skillNodes.find(n => n.id === connection.source);
        const targetNode = skillNodes.find(n => n.id === connection.target);
        
        if (sourceNode && targetNode) {
          // Draw line
          ctx.beginPath();
          ctx.moveTo(sourceNode.x, sourceNode.y);
          ctx.lineTo(targetNode.x, targetNode.y);
          
          // Style based on mastery level vs required mastery level
          if (sourceNode.masteryLevel >= connection.requiredMasteryLevel) {
            ctx.strokeStyle = '#4CAF50'; // Green if mastery level met
            ctx.lineWidth = 3;
          } else {
            ctx.strokeStyle = '#999'; // Gray if mastery level not met
            ctx.lineWidth = 1;
          }
          
          ctx.stroke();
          
          // Draw required mastery level label
          const midX = (sourceNode.x + targetNode.x) / 2;
          const midY = (sourceNode.y + targetNode.y) / 2;
          
          ctx.fillStyle = '#333';
          ctx.font = '12px Arial';
          ctx.fillText(`${Math.round(connection.requiredMasteryLevel * 100)}%`, midX, midY);
        }
      });
    });
    
    // Draw nodes
    skillNodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
      
      // Style based on mastery level and availability
      if (!node.isAvailable) {
        ctx.fillStyle = '#f5f5f5'; // Light gray for unavailable skills
      } else if (node.masteryLevel >= 0.8) {
        ctx.fillStyle = '#4CAF50'; // Green for high mastery
      } else if (node.masteryLevel >= 0.4) {
        ctx.fillStyle = '#FFC107'; // Yellow for medium mastery
      } else {
        ctx.fillStyle = '#FF5722'; // Orange for low mastery
      }
      
      ctx.fill();
      
      // Draw difficulty indicator (1-5 small dots around the node)
      for (let i = 0; i < node.difficulty; i++) {
        const angle = (i / node.difficulty) * Math.PI * 2;
        const dotX = node.x + Math.cos(angle) * (nodeRadius + 10);
        const dotY = node.y + Math.sin(angle) * (nodeRadius + 10);
        
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3, 0, 2 * Math.PI);
        ctx.fillStyle = '#333';
        ctx.fill();
      }
      
      // Draw mastery level as a progress arc around the node
      if (node.masteryLevel > 0) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius + 5, 0, node.masteryLevel * 2 * Math.PI);
        ctx.strokeStyle = '#2196F3'; // Blue for mastery progress
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      
      // Draw node border (highlight if selected)
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = node === selectedNode ? '#7B1FA2' : '#333';
      ctx.lineWidth = node === selectedNode ? 3 : 1;
      ctx.stroke();
      
      // Draw node name
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, node.x, node.y - nodeRadius - 10);
      
      // Draw mastery percentage
      if (node.masteryLevel > 0) {
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(node.masteryLevel * 100)}%`, node.x, node.y + 5);
      }
    });
  }
  
  function handleCanvasClick(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if any node was clicked
    let clickedNode = null;
    for (const node of skillNodes) {
      const dx = x - node.x;
      const dy = y - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= nodeRadius) {
        clickedNode = node;
        break;
      }
    }
    
    selectedNode = clickedNode;
    renderGraph();
  }
  
  function updateCategoryFilter() {
    initializeGraph();
  }
  
  onMount(async () => {
    await session.loadData();
    initializeGraph();
    
    // Handle window resize
    const handleResize = () => {
      const container = canvas.parentElement;
      if (container) {
        width = container.clientWidth;
        height = Math.max(container.clientHeight, 600);
        canvas.width = width;
        canvas.height = height;
        initializeGraph();
      }
    };
    
    window.addEventListener('resize', handleResize);
    // Initial sizing
    setTimeout(handleResize, 0);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });
</script>

<main class="container">
  <div class="header">
    <h1>Skill Progression</h1>
    
    <div class="category-filter">
      <label for="category-select">Filter by category:</label>
      <select id="category-select" bind:value={selectedCategoryId} on:change={updateCategoryFilter}>
        <option value={null}>All Categories</option>
        {#each skillCategories.all as category}
          <option value={category.id}>{category.name}</option>
        {/each}
      </select>
    </div>
  </div>
  
  <div class="visualization-container">
    <canvas 
      bind:this={canvas} 
      width={width} 
      height={height} 
      on:click={handleCanvasClick}
    ></canvas>
  </div>
  
  <div class="skill-details">
    {#if selectedNode}
      <h2>{selectedNode.name}</h2>
      <div class="stats">
        <div class="stat">
          <span class="label">Difficulty:</span>
          <span class="value">
            {#each Array(5) as _, i}
              <span class={i < selectedNode.difficulty ? 'star filled' : 'star'}>★</span>
            {/each}
          </span>
        </div>
        <div class="stat">
          <span class="label">Mastery Level:</span>
          <div class="progress-bar">
            <div class="progress" style="width: {selectedNode.masteryLevel * 100}%"></div>
            <span class="progress-text">{Math.round(selectedNode.masteryLevel * 100)}%</span>
          </div>
        </div>
        <div class="stat">
          <span class="label">Status:</span>
          <span class="value status-badge" class:available={selectedNode.isAvailable} class:locked={!selectedNode.isAvailable}>
            {selectedNode.isAvailable ? 'Available' : 'Locked'}
          </span>
        </div>
      </div>
      
      <div class="prerequisites">
        <h3>Prerequisites</h3>
        {#if selectedNode.connections.length > 0}
          <ul>
            {#each selectedNode.connections as connection}
              {#if connection.source === selectedNode.id}
                {@const targetNode = skillNodes.find(n => n.id === connection.target)}
                {#if targetNode}
                  <li>
                    <span>{targetNode.name}</span>
                    <span class="requirement-level">Required Mastery: {Math.round(connection.requiredMasteryLevel * 100)}%</span>
                  </li>
                {/if}
              {/if}
            {/each}
          </ul>
        {:else}
          <p>No prerequisites needed for this skill.</p>
        {/if}
      </div>
    {:else}
      <p class="select-prompt">Select a skill node to view details</p>
    {/if}
  </div>
  
  <div class="legend">
    <h3>Legend</h3>
    <div class="legend-item">
      <div class="legend-color" style="background-color: #FF5722;"></div>
      <span>Low Mastery (0-40%)</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background-color: #FFC107;"></div>
      <span>Medium Mastery (40-80%)</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background-color: #4CAF50;"></div>
      <span>High Mastery (80-100%)</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background-color: #f5f5f5;"></div>
      <span>Locked Skill</span>
    </div>
    <div class="legend-item">
      <div class="legend-line" style="background-color: #4CAF50;"></div>
      <span>Prerequisite Met</span>
    </div>
    <div class="legend-item">
      <div class="legend-line" style="background-color: #999;"></div>
      <span>Prerequisite Not Met</span>
    </div>
  </div>
</main>

<style>
  .container {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 1rem;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .category-filter {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .category-filter select {
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid #ccc;
  }
  
  .visualization-container {
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: #f9f9f9;
    margin-bottom: 2rem;
    min-height: 600px;
    position: relative;
  }
  
  canvas {
    width: 100%;
    height: 100%;
    cursor: pointer;
  }
  
  .skill-details {
    background-color: #f5f5f5;
    border-radius: 4px;
    padding: 1rem;
    margin-bottom: 2rem;
    min-height: 200px;
  }
  
  .skill-details h2 {
    margin-top: 0;
    color: #333;
  }
  
  .select-prompt {
    color: #666;
    font-style: italic;
    text-align: center;
    margin-top: 2rem;
  }
  
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .label {
    font-weight: bold;
    color: #555;
  }
  
  .star {
    color: #ddd;
    font-size: 1.2rem;
  }
  
  .star.filled {
    color: #FFC107;
  }
  
  .progress-bar {
    background-color: #eee;
    border-radius: 10px;
    height: 20px;
    position: relative;
    overflow: hidden;
  }
  
  .progress {
    background-color: #2196F3;
    height: 100%;
    border-radius: 10px;
  }
  
  .progress-text {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #333;
    font-weight: bold;
  }
  
  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 10px;
    font-weight: bold;
  }
  
  .status-badge.available {
    background-color: #E8F5E9;
    color: #2E7D32;
  }
  
  .status-badge.locked {
    background-color: #FFEBEE;
    color: #C62828;
  }
  
  .prerequisites h3 {
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
  }
  
  .prerequisites ul {
    list-style-type: none;
    padding: 0;
  }
  
  .prerequisites li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background-color: #fff;
    border-radius: 4px;
    margin-bottom: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .requirement-level {
    color: #666;
    font-size: 0.9rem;
  }
  
  .legend {
    background-color: #f5f5f5;
    border-radius: 4px;
    padding: 1rem;
  }
  
  .legend h3 {
    margin-top: 0;
    margin-bottom: 1rem;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .legend-color {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1px solid #ddd;
  }
  
  .legend-line {
    width: 30px;
    height: 3px;
  }
</style>