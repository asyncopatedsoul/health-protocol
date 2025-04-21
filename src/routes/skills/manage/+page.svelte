<script lang="ts">
  import { bindSkillCategories, bindActivitySkills, bindSkillPrerequisites, bindActivities, bindSession } from "../../../data/models.svelte";
  import { onMount } from "svelte";
  
  const session = bindSession();
  const skillCategories = bindSkillCategories();
  const activities = bindActivities();
  const activitySkills = bindActivitySkills();
  const skillPrerequisites = bindSkillPrerequisites();
  
  let selectedActivityId: number | null = null;
  let selectedSkillId: number | null = null;
  let selectedCategoryId: number | null = null;
  
  // Form for adding new skills
  let newSkillName = "";
  let newSkillDescription = "";
  let newSkillDifficulty = 1;
  let newSkillCategoryId: number | null = null;
  
  // Form for adding prerequisites
  let prerequisiteSkillId: number | null = null;
  let requiredMasteryLevel = 0.6; // Default 60%
  
  // For adding new skill categories
  let newCategoryName = "";
  let newCategoryDescription = "";
  let newCategoryColor = "#808080";
  
  function resetNewSkillForm() {
    newSkillName = "";
    newSkillDescription = "";
    newSkillDifficulty = 1;
    newSkillCategoryId = null;
  }
  
  function resetNewCategoryForm() {
    newCategoryName = "";
    newCategoryDescription = "";
    newCategoryColor = "#808080";
  }
  
  async function handleAddSkill() {
    if (!selectedActivityId || !newSkillName) {
      alert("Please select an activity and enter a skill name.");
      return;
    }
    
    const skillId = await activitySkills.add({
      activityId: selectedActivityId,
      name: newSkillName,
      description: newSkillDescription,
      difficulty: newSkillDifficulty,
      categoryId: newSkillCategoryId
    });
    
    if (skillId) {
      resetNewSkillForm();
      // Re-fetch data to update lists
      await session.loadData();
    } else {
      alert("Failed to add skill. Please try again.");
    }
  }
  
  async function handleAddPrerequisite() {
    if (!selectedSkillId || !prerequisiteSkillId) {
      alert("Please select both a skill and a prerequisite skill.");
      return;
    }
    
    // Prevent adding self as prerequisite
    if (selectedSkillId === prerequisiteSkillId) {
      alert("A skill cannot be a prerequisite for itself.");
      return;
    }
    
    const prerequisiteId = await skillPrerequisites.add({
      skillId: selectedSkillId,
      prerequisiteSkillId: prerequisiteSkillId,
      requiredMasteryLevel: requiredMasteryLevel
    });
    
    if (prerequisiteId) {
      prerequisiteSkillId = null;
      requiredMasteryLevel = 0.6;
      // Re-fetch data to update lists
      await session.loadData();
    } else {
      alert("Failed to add prerequisite. Please try again.");
    }
  }
  
  async function handleAddCategory() {
    if (!newCategoryName) {
      alert("Please enter a category name.");
      return;
    }
    
    const categoryId = await skillCategories.add({
      name: newCategoryName,
      description: newCategoryDescription,
      color: newCategoryColor
    });
    
    if (categoryId) {
      resetNewCategoryForm();
      // Re-fetch data to update lists
      await session.loadData();
    } else {
      alert("Failed to add category. Please try again.");
    }
  }
  
  // Get skills for the selected activity
  $: activitySkillsList = selectedActivityId 
    ? activitySkills.getByActivity(selectedActivityId) 
    : [];
    
  // Get prerequisites for the selected skill
  $: skillPrerequisitesList = selectedSkillId
    ? skillPrerequisites.getPrerequisitesForSkill(selectedSkillId)
    : [];
    
  // Get skills filtered by category for prerequisite selection
  $: prerequisiteSkillsList = selectedCategoryId 
    ? activitySkills.getByCategory(selectedCategoryId)
    : activitySkills.all;
  
  onMount(async () => {
    await session.loadData();
  });
</script>

<main class="container">
  <div class="header">
    <h1>Manage Skills & Progression</h1>
    <a href="/skills" class="button secondary">View Skill Tree</a>
  </div>
  
  <div class="grid-layout">
    <div class="card">
      <h2>Add Skill Category</h2>
      <form on:submit|preventDefault={handleAddCategory}>
        <div class="form-group">
          <label for="category-name">Category Name:</label>
          <input id="category-name" type="text" bind:value={newCategoryName} required />
        </div>
        
        <div class="form-group">
          <label for="category-description">Description:</label>
          <textarea id="category-description" bind:value={newCategoryDescription}></textarea>
        </div>
        
        <div class="form-group">
          <label for="category-color">Color:</label>
          <input id="category-color" type="color" bind:value={newCategoryColor} />
        </div>
        
        <button type="submit" class="button primary">Add Category</button>
      </form>
      
      <h3>Existing Categories</h3>
      {#if skillCategories.all.length === 0}
        <p>No categories defined yet.</p>
      {:else}
        <ul class="category-list">
          {#each skillCategories.all as category}
            <li style="border-left-color: {category.color}">
              <strong>{category.name}</strong>
              {#if category.description}
                <p>{category.description}</p>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
    
    <div class="card">
      <h2>Add Activity Skill</h2>
      <form on:submit|preventDefault={handleAddSkill}>
        <div class="form-group">
          <label for="activity-select">Activity:</label>
          <select id="activity-select" bind:value={selectedActivityId} required>
            <option value={null}>Select an activity</option>
            {#each activities.all as activity}
              <option value={activity.id}>{activity.name}</option>
            {/each}
          </select>
        </div>
        
        <div class="form-group">
          <label for="skill-name">Skill Name:</label>
          <input id="skill-name" type="text" bind:value={newSkillName} required />
        </div>
        
        <div class="form-group">
          <label for="skill-description">Description:</label>
          <textarea id="skill-description" bind:value={newSkillDescription}></textarea>
        </div>
        
        <div class="form-group">
          <label for="skill-difficulty">Difficulty (1-5):</label>
          <input 
            id="skill-difficulty" 
            type="range" 
            min="1" 
            max="5" 
            step="1" 
            bind:value={newSkillDifficulty} 
          />
          <span>{newSkillDifficulty}</span>
        </div>
        
        <div class="form-group">
          <label for="skill-category">Category:</label>
          <select id="skill-category" bind:value={newSkillCategoryId}>
            <option value={null}>None</option>
            {#each skillCategories.all as category}
              <option value={category.id}>{category.name}</option>
            {/each}
          </select>
        </div>
        
        <button type="submit" class="button primary">Add Skill</button>
      </form>
      
      <h3>Skills for Selected Activity</h3>
      {#if !selectedActivityId}
        <p>Select an activity to see its skills.</p>
      {:else if activitySkillsList.length === 0}
        <p>No skills defined for this activity yet.</p>
      {:else}
        <ul class="skill-list">
          {#each activitySkillsList as skill}
            <li>
              <strong>{skill.name}</strong>
              <div class="skill-difficulty">
                {#each Array(5) as _, i}
                  <span class={i < skill.difficulty ? 'star filled' : 'star'}>★</span>
                {/each}
              </div>
              {#if skill.description}
                <p>{skill.description}</p>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
    
    <div class="card">
      <h2>Define Skill Prerequisites</h2>
      <form on:submit|preventDefault={handleAddPrerequisite}>
        <div class="form-group">
          <label for="target-skill">Target Skill:</label>
          <select id="target-skill" bind:value={selectedSkillId} required>
            <option value={null}>Select a skill</option>
            {#each activitySkills.all as skill}
              <option value={skill.id}>{skill.name}</option>
            {/each}
          </select>
        </div>
        
        <div class="form-group">
          <label for="prerequisite-category-filter">Filter prerequisites by category:</label>
          <select id="prerequisite-category-filter" bind:value={selectedCategoryId}>
            <option value={null}>All Categories</option>
            {#each skillCategories.all as category}
              <option value={category.id}>{category.name}</option>
            {/each}
          </select>
        </div>
        
        <div class="form-group">
          <label for="prerequisite-skill">Prerequisite Skill:</label>
          <select id="prerequisite-skill" bind:value={prerequisiteSkillId} required>
            <option value={null}>Select a prerequisite</option>
            {#each prerequisiteSkillsList as skill}
              {#if skill.id !== selectedSkillId}
                <option value={skill.id}>{skill.name}</option>
              {/if}
            {/each}
          </select>
        </div>
        
        <div class="form-group">
          <label for="mastery-level">Required Mastery Level:</label>
          <input 
            id="mastery-level" 
            type="range" 
            min="0.1" 
            max="1" 
            step="0.1" 
            bind:value={requiredMasteryLevel} 
          />
          <span>{Math.round(requiredMasteryLevel * 100)}%</span>
        </div>
        
        <button type="submit" class="button primary">Add Prerequisite</button>
      </form>
      
      <h3>Prerequisites for Selected Skill</h3>
      {#if !selectedSkillId}
        <p>Select a skill to see its prerequisites.</p>
      {:else if skillPrerequisitesList.length === 0}
        <p>No prerequisites defined for this skill yet.</p>
      {:else}
        <ul class="prerequisite-list">
          {#each skillPrerequisitesList as prerequisite}
            <li>
              <div class="prerequisite-details">
                <span class="prerequisite-name">{prerequisite.prerequisiteSkillName}</span>
                <span class="prerequisite-level">Required: {Math.round(prerequisite.requiredMasteryLevel * 100)}%</span>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
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
  
  .grid-layout {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1.5rem;
  }
  
  .card {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
  }
  
  h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    color: #333;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.5rem;
  }
  
  h3 {
    margin-top: 2rem;
    margin-bottom: 1rem;
    color: #555;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #555;
  }
  
  input[type="text"],
  input[type="color"],
  textarea,
  select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  textarea {
    min-height: 100px;
    resize: vertical;
  }
  
  input[type="range"] {
    width: 100%;
  }
  
  .button {
    display: inline-block;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    text-decoration: none;
  }
  
  .button.primary {
    background-color: #4CAF50;
    color: white;
  }
  
  .button.secondary {
    background-color: #2196F3;
    color: white;
  }
  
  .category-list,
  .skill-list,
  .prerequisite-list {
    list-style-type: none;
    padding: 0;
  }
  
  .category-list li {
    padding: 0.75rem;
    margin-bottom: 0.75rem;
    background-color: #f9f9f9;
    border-radius: 4px;
    border-left: 5px solid;
  }
  
  .category-list p,
  .skill-list p {
    margin: 0.5rem 0 0;
    color: #666;
    font-size: 0.9rem;
  }
  
  .skill-list li {
    padding: 0.75rem;
    margin-bottom: 0.75rem;
    background-color: #f9f9f9;
    border-radius: 4px;
  }
  
  .skill-difficulty {
    margin: 0.25rem 0;
  }
  
  .star {
    color: #ddd;
  }
  
  .star.filled {
    color: #FFC107;
  }
  
  .prerequisite-list li {
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    background-color: #f9f9f9;
    border-radius: 4px;
    border-left: 3px solid #2196F3;
  }
  
  .prerequisite-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .prerequisite-name {
    font-weight: bold;
  }
  
  .prerequisite-level {
    font-size: 0.9rem;
    color: #666;
    background-color: #e3f2fd;
    padding: 0.2rem 0.5rem;
    border-radius: 10px;
  }
</style>