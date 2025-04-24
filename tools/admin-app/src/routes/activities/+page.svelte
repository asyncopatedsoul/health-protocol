<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  let dataLoaded = false;
  let error = null;
  
  // We'll load D3 dynamically to avoid SSR issues
  let d3;
  
  onMount(async () => {
    try {
      // Dynamically import D3 only on the client side
      d3 = await import('d3');
      
      // Fetch activity data
      const response = await fetch('/api/activities');
      if (!response.ok) {
        throw new Error(`Error fetching activity data: ${response.statusText}`);
      }
      
      const data = await response.json();
      createVisualization(data);
      dataLoaded = true;
    } catch (err) {
      console.error('Error:', err);
      error = err.message;
    }
  });
  
  function createVisualization(data) {
    if (!browser || !d3) return;
    
    const width = 960;
    const height = 600;
    
    // Clear any existing SVG
    d3.select('#visualization').selectAll('*').remove();
    
    // Create SVG
    const svg = d3.select('#visualization')
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);
    
    // Define arrow markers for links
    svg.append('defs').selectAll('marker')
      .data(['related_skill', 'compound_skill', 'prerequisite_skill'])
      .join('marker')
      .attr('id', d => `arrow-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', d => {
        if (d === 'related_skill') return '#999';
        if (d === 'compound_skill') return '#1E88E5';
        return '#E53935'; // prerequisite_skill
      })
      .attr('d', 'M0,-5L10,0L0,5');
    
    // Create force simulation
    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links)
        .id(d => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));
    
    // Create links
    const link = svg.append('g')
      .selectAll('path')
      .data(data.links)
      .join('path')
      .attr('stroke', d => {
        if (d.type === 'related_skill') return '#999';
        if (d.type === 'compound_skill') return '#1E88E5';
        return '#E53935'; // prerequisite_skill
      })
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6)
      .attr('fill', 'none')
      .attr('marker-end', d => `url(#arrow-${d.type})`);
    
    // Create a group for each node
    const node = svg.append('g')
      .selectAll('.node')
      .data(data.nodes)
      .join('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));
    
    // Add circles to the node groups
    node.append('circle')
      .attr('r', d => 10 + 2 * (d.difficulty || 1))
      .attr('fill', d => {
        switch(d.type) {
          case 'breathwork': return '#4CAF50';
          case 'calisthenics': return '#FF9800';
          case 'meditation': return '#9C27B0';
          case 'strength': return '#F44336';
          default: return '#607D8B';
        }
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);
    
    // Add text labels
    node.append('text')
      .text(d => d.name)
      .attr('x', 15)
      .attr('y', 4)
      .attr('font-size', '12px')
      .attr('font-family', 'sans-serif');
    
    // Add title for tooltip
    node.append('title')
      .text(d => `${d.name}
Type: ${d.type || 'Unknown'}
Difficulty: ${d.difficulty || 1}
Complexity: ${d.complexity || 1}`);
    
    // Update positions on tick
    simulation.on('tick', () => {
      link.attr('d', linkArc);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    // Functions for dragging behavior
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    // Function to draw curved links
    function linkArc(d) {
      const dx = d.target.x - d.source.x;
      const dy = d.target.y - d.source.y;
      const dr = Math.sqrt(dx * dx + dy * dy);
      return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
    }
    
    // Legend for node types
    const legend = svg.append('g')
      .attr('transform', 'translate(20, 20)');
    
    const nodeTypes = [
      { type: 'breathwork', color: '#4CAF50', label: 'Breathwork' },
      { type: 'calisthenics', color: '#FF9800', label: 'Calisthenics' },
      { type: 'meditation', color: '#9C27B0', label: 'Meditation' },
      { type: 'strength', color: '#F44336', label: 'Strength' },
      { type: 'other', color: '#607D8B', label: 'Other' }
    ];
    
    nodeTypes.forEach((item, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);
      
      legendRow.append('rect')
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', item.color);
      
      legendRow.append('text')
        .attr('x', 15)
        .attr('y', 10)
        .text(item.label)
        .style('font-size', '12px')
        .attr('font-family', 'sans-serif');
    });
    
    // Legend for relationship types
    const relationLegend = svg.append('g')
      .attr('transform', `translate(150, 20)`);
    
    const relationTypes = [
      { type: 'related_skill', color: '#999', label: 'Related Skill' },
      { type: 'compound_skill', color: '#1E88E5', label: 'Compound Skill' },
      { type: 'prerequisite_skill', color: '#E53935', label: 'Prerequisite Skill' }
    ];
    
    relationTypes.forEach((item, i) => {
      const legendRow = relationLegend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);
      
      legendRow.append('line')
        .attr('x1', 0)
        .attr('y1', 5)
        .attr('x2', 10)
        .attr('y2', 5)
        .attr('stroke', item.color)
        .attr('stroke-width', 2);
      
      legendRow.append('text')
        .attr('x', 15)
        .attr('y', 10)
        .text(item.label)
        .style('font-size', '12px')
        .attr('font-family', 'sans-serif');
    });
  }
</script>

<svelte:head>
  <title>Activity Relationship Visualization</title>
</svelte:head>

<div class="container">
  <h1>Health Protocol Activity Relationships</h1>
  
  {#if error}
    <div class="error">
      <p>Error loading visualization: {error}</p>
    </div>
  {:else if !dataLoaded}
    <div class="loading">
      <p>Loading visualization...</p>
    </div>
  {/if}
  
  <div id="visualization" class="visualization-container"></div>
  
  <div class="instructions">
    <h2>Instructions</h2>
    <ul>
      <li>Drag nodes to reposition them</li>
      <li>Hover over nodes to see details</li>
      <li>Colors represent different activity types</li>
      <li>Lines represent different relationship types between activities</li>
    </ul>
  </div>
</div>

<style>
  .container {
    margin: 0 auto;
    max-width: 1200px;
    padding: 20px;
  }
  
  h1 {
    color: #333;
    text-align: center;
    margin-bottom: 20px;
  }
  
  .visualization-container {
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 5px;
    overflow: hidden;
    margin-bottom: 20px;
  }
  
  .error {
    background-color: #ffebee;
    color: #c62828;
    padding: 15px;
    border-radius: 5px;
    margin-bottom: 20px;
  }
  
  .loading {
    text-align: center;
    padding: 20px;
    font-style: italic;
    color: #666;
  }
  
  .instructions {
    background-color: #e8f5e9;
    padding: 15px;
    border-radius: 5px;
    margin-top: 20px;
  }
  
  .instructions h2 {
    margin-top: 0;
    font-size: 1.3rem;
    color: #2e7d32;
  }
  
  .instructions ul {
    margin-bottom: 0;
  }
</style>