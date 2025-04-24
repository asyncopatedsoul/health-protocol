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
    const nodeRadius = 20; // Maximum node radius for boundary calculations
    
    // Clear any existing SVG
    d3.select('#visualization').selectAll('*').remove();
    
    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.2, 5]) // Zoom scale limits
      .on('zoom', (event) => {
        graphGroup.attr('transform', event.transform);
      });
    
    // Create SVG with zoom behavior
    const svg = d3.select('#visualization')
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .call(zoom)
      .on('dblclick.zoom', null); // Disable double-click zoom to allow for node interactions
    
    // Add rectangle to catch mouse events for panning
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all');
    
    // Add group for graph content that will be transformed during zoom
    const graphGroup = svg.append('g')
      .attr('class', 'graph-content');
    
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
      .force('collision', d3.forceCollide().radius(40))
      // Add forces to keep nodes within bounds
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05));
    
    // Create links
    const link = graphGroup.append('g')
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
    const node = graphGroup.append('g')
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
    
    // Update positions on tick with boundary constraints
    simulation.on('tick', () => {
      // Constrain nodes within canvas bounds
      data.nodes.forEach(d => {
        d.x = Math.max(nodeRadius, Math.min(width - nodeRadius, d.x));
        d.y = Math.max(nodeRadius, Math.min(height - nodeRadius, d.y));
      });
      
      // Update position of links and nodes
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
      // Constrain drag within canvas bounds
      d.fx = Math.max(nodeRadius, Math.min(width - nodeRadius, event.x));
      d.fy = Math.max(nodeRadius, Math.min(height - nodeRadius, event.y));
    }
    
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      // Option 2: Keep positions fixed after drag (better for manual arrangement)
      // Already set by 'dragged' function
    }
    
    // Function to draw curved links
    function linkArc(d) {
      const dx = d.target.x - d.source.x;
      const dy = d.target.y - d.source.y;
      const dr = Math.sqrt(dx * dx + dy * dy);
      return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
    }
    
    // Create a fixed overlay container for controls and legends
    const overlay = svg.append('g')
      .attr('class', 'overlay')
      .attr('pointer-events', 'none'); // Ensure it doesn't interfere with graph interactions
    
    // Add a semi-transparent background for the legend
    overlay.append('rect')
      .attr('x', 10)
      .attr('y', 10)
      .attr('width', 280)
      .attr('height', 150)
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('fill', 'rgba(255, 255, 255, 0.85)');
    
    // Legend for node types - pinned to top left
    const legend = overlay.append('g')
      .attr('transform', 'translate(20, 20)')
      .attr('pointer-events', 'all'); // Make legend items clickable
    
    // Add legend title
    legend.append('text')
      .attr('x', 0)
      .attr('y', -5)
      .text('Activity Types')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .attr('font-family', 'sans-serif');
    
    const nodeTypes = [
      { type: 'breathwork', color: '#4CAF50', label: 'Breathwork' },
      { type: 'calisthenics', color: '#FF9800', label: 'Calisthenics' },
      { type: 'meditation', color: '#9C27B0', label: 'Meditation' },
      { type: 'strength', color: '#F44336', label: 'Strength' },
      { type: 'other', color: '#607D8B', label: 'Other' }
    ];
    
    nodeTypes.forEach((item, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20 + 15})`);
      
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
    const relationLegend = overlay.append('g')
      .attr('transform', `translate(150, 20)`)
      .attr('pointer-events', 'all');
    
    // Add legend title
    relationLegend.append('text')
      .attr('x', 0)
      .attr('y', -5)
      .text('Relationship Types')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .attr('font-family', 'sans-serif');
    
    const relationTypes = [
      { type: 'related_skill', color: '#999', label: 'Related Skill' },
      { type: 'compound_skill', color: '#1E88E5', label: 'Compound Skill' },
      { type: 'prerequisite_skill', color: '#E53935', label: 'Prerequisite Skill' }
    ];
    
    relationTypes.forEach((item, i) => {
      const legendRow = relationLegend.append('g')
        .attr('transform', `translate(0, ${i * 20 + 15})`);
      
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
    
    // Create background for zoom controls
    overlay.append('rect')
      .attr('x', width - 50)
      .attr('y', height - 120)
      .attr('width', 40)
      .attr('height', 110)
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('fill', 'rgba(255, 255, 255, 0.85)');
    
    // Create zoom controls - pinned to bottom right
    const zoomControls = overlay.append('g')
      .attr('class', 'zoom-controls')
      .attr('transform', `translate(${width - 30}, ${height - 100})`)
      .attr('pointer-events', 'all'); // Make zoom buttons clickable
    
    // Zoom in button
    const zoomIn = zoomControls.append('g')
      .attr('class', 'zoom-button')
      .attr('transform', 'translate(0, 0)')
      .style('cursor', 'pointer')
      .on('click', () => {
        svg.transition().duration(300).call(zoom.scaleBy, 1.3);
      });
    
    zoomIn.append('circle')
      .attr('r', 15)
      .attr('fill', '#4CAF50')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);
    
    zoomIn.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('fill', '#fff')
      .attr('font-size', '20px')
      .attr('font-weight', 'bold')
      .text('+');
    
    // Zoom out button
    const zoomOut = zoomControls.append('g')
      .attr('class', 'zoom-button')
      .attr('transform', 'translate(0, 40)')
      .style('cursor', 'pointer')
      .on('click', () => {
        svg.transition().duration(300).call(zoom.scaleBy, 0.7);
      });
    
    zoomOut.append('circle')
      .attr('r', 15)
      .attr('fill', '#F44336')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);
    
    zoomOut.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('fill', '#fff')
      .attr('font-size', '20px')
      .attr('font-weight', 'bold')
      .text('-');
    
    // Reset zoom button
    const resetZoom = zoomControls.append('g')
      .attr('class', 'zoom-button')
      .attr('transform', 'translate(0, 80)')
      .style('cursor', 'pointer')
      .on('click', () => {
        svg.transition().duration(300).call(
          zoom.transform,
          d3.zoomIdentity
        );
      });
    
    resetZoom.append('circle')
      .attr('r', 15)
      .attr('fill', '#2196F3')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);
    
    resetZoom.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('fill', '#fff')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('R');
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
      <li>Use the mouse wheel or zoom buttons to zoom in/out</li>
      <li>Click and drag the background to pan the view</li>
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
    height: 600px; /* Fixed height to match SVG */
    position: relative; /* For positioning overlays */
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