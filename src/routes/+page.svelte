<script lang="ts">
  import { bindUsers, bindSession, bindActivities, bindActivitySkills, bindUserSkillProgress } from "../data/models.svelte";
  import { onMount } from "svelte";
  
  const users = bindUsers();
  const session = bindSession();
  const activities = bindActivities();
  const activitySkills = bindActivitySkills();
  const userSkillProgress = bindUserSkillProgress();
  
  let userName = $state("");
  let userEmail = $state("");
  let selectedUserId = $state(null);
  
  let totalActivities = $state(0);
  let totalSkills = $state(0);
  let userSkillsCount = $state(0);
  let averageMastery = $state(0);
  
  async function createUser(event) {
    event.preventDefault();
    
    if (!userName) {
      alert("Please enter your name.");
      return;
    }
    
    await users.add({
      id: 0, // Temporary, will be assigned by the database
      name: userName,
      email: userEmail || ""
    });
    
    // Refresh data
    await session.loadData();
    
    // Reset form
    userName = "";
    userEmail = "";
  }
  
  function selectUser(userId) {
    selectedUserId = userId;
    session.currentUser = users.all.find(u => u.id === userId);
    refreshStats();
  }
  
  function refreshStats() {
    totalActivities = activities.all.length;
    totalSkills = activitySkills.all.length;
    
    if (session.currentUser && session.currentUser.id) {
      const userProgress = userSkillProgress.getByUser(session.currentUser.id);
      userSkillsCount = userProgress.length;
      
      // Calculate average mastery
      if (userSkillsCount > 0) {
        const totalMastery = userProgress.reduce((sum, progress) => sum + progress.masteryLevel, 0);
        averageMastery = totalMastery / userSkillsCount;
      } else {
        averageMastery = 0;
      }
    }
  }
  
  onMount(async () => {
    await session.loadData();
    refreshStats();
  });
</script>

<main class="container">
  <div class="hero">
    <h1>Health Protocol Skills Tracker</h1>
    <p class="tagline">Track your progress, build your skills, achieve your health goals</p>
  </div>
  
  <div class="user-selection">
    {#if !session.currentUser || !session.currentUser.id}
      <div class="card">
        <h2>Select Your Profile</h2>
        
        {#if users.all.length === 0}
          <p>No user profiles found. Create one to get started!</p>
        {:else}
          <div class="user-list">
            {#each users.all as user}
              <button 
                class="user-card" 
                on:click={() => selectUser(user.id)}
              >
                <div class="user-avatar">{user.name.charAt(0)}</div>
                <div class="user-info">
                  <h3>{user.name}</h3>
                  {#if user.email}
                    <p>{user.email}</p>
                  {/if}
                </div>
              </button>
            {/each}
          </div>
        {/if}
        
        <div class="divider">
          <span>or</span>
        </div>
        
        <h2>Create New Profile</h2>
        <form on:submit={createUser}>
          <div class="form-group">
            <label for="name">Name:</label>
            <input id="name" type="text" bind:value={userName} required />
          </div>
          
          <div class="form-group">
            <label for="email">Email (optional):</label>
            <input id="email" type="email" bind:value={userEmail} />
          </div>
          
          <button type="submit" class="button primary">Create Profile</button>
        </form>
      </div>
    {:else}
      <div class="dashboard">
        <div class="welcome-section">
          <h2>Welcome, {session.currentUser.name}!</h2>
          <button class="button secondary small" on:click={() => session.currentUser = null}>Switch User</button>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{totalActivities}</div>
            <div class="stat-label">Total Activities</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-value">{totalSkills}</div>
            <div class="stat-label">Available Skills</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-value">{userSkillsCount}</div>
            <div class="stat-label">Skills In Progress</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-value">{Math.round(averageMastery * 100)}%</div>
            <div class="stat-label">Average Mastery</div>
          </div>
        </div>
        
        <div class="action-links">
          <a href="/protocols" class="button primary">View Protocols</a>
          <a href="/skills" class="button primary">Skill Progression</a>
          <a href="/skills/manage" class="button secondary">Manage Skills</a>
        </div>
      </div>
    {/if}
  </div>
  
  <div class="features">
    <div class="feature-card">
      <h3>Track Progress</h3>
      <p>Monitor your skill development over time with detailed analytics and progress tracking.</p>
    </div>
    
    <div class="feature-card">
      <h3>Skill Trees</h3>
      <p>Visualize skill relationships and unlock advanced techniques as you master the basics.</p>
    </div>
    
    <div class="feature-card">
      <h3>Personalized Path</h3>
      <p>Follow a customized progression path based on your current abilities and goals.</p>
    </div>
  </div>
</main>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }
  
  .hero {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .hero h1 {
    font-size: 2.5rem;
    color: #333;
    margin-bottom: 0.5rem;
  }
  
  .tagline {
    font-size: 1.2rem;
    color: #666;
  }
  
  .card {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    margin-bottom: 2rem;
  }
  
  .user-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
    margin: 1rem 0 2rem;
  }
  
  .user-card {
    display: flex;
    align-items: center;
    padding: 1rem;
    background-color: #f9f9f9;
    border: 1px solid #eee;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    width: 100%;
  }
  
  .user-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-color: #ccc;
  }
  
  .user-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background-color: #4CAF50;
    color: white;
    border-radius: 50%;
    font-weight: bold;
    margin-right: 1rem;
  }
  
  .user-info h3 {
    margin: 0;
    font-size: 1rem;
  }
  
  .user-info p {
    margin: 0.25rem 0 0;
    font-size: 0.9rem;
    color: #666;
  }
  
  .divider {
    display: flex;
    align-items: center;
    text-align: center;
    margin: 2rem 0;
    color: #999;
  }
  
  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #ddd;
  }
  
  .divider span {
    padding: 0 1rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #555;
  }
  
  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  .button {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    text-decoration: none;
    text-align: center;
    transition: background-color 0.2s;
  }
  
  .button.small {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
  
  .button.primary {
    background-color: #4CAF50;
    color: white;
  }
  
  .button.primary:hover {
    background-color: #45a049;
  }
  
  .button.secondary {
    background-color: #2196F3;
    color: white;
  }
  
  .button.secondary:hover {
    background-color: #0b7dda;
  }
  
  .dashboard {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    margin-bottom: 2rem;
  }
  
  .welcome-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .welcome-section h2 {
    margin: 0;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .stat-card {
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 1.5rem;
    text-align: center;
    transition: transform 0.2s;
  }
  
  .stat-card:hover {
    transform: translateY(-5px);
  }
  
  .stat-value {
    font-size: 2.5rem;
    font-weight: bold;
    color: #333;
    margin-bottom: 0.5rem;
  }
  
  .stat-label {
    color: #666;
  }
  
  .action-links {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 3rem;
  }
  
  .feature-card {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    text-align: center;
    transition: transform 0.2s;
  }
  
  .feature-card:hover {
    transform: translateY(-5px);
  }
  
  .feature-card h3 {
    margin-top: 0;
    color: #333;
  }
  
  .feature-card p {
    color: #666;
    margin-bottom: 0;
  }
</style>