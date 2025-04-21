<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import Database from "@tauri-apps/plugin-sql";
  import { onMount, onDestroy } from "svelte";
  import "../styles/App.css";

  type User = {
    id: number;
    name: string;
    email: string;
  };

  let name = $state("");
  let email = $state("");

  let greetMsg = $state("");
  let users = $state([] as User[]);

  import { appDataDir, dataDir } from "@tauri-apps/api/path";

  onMount(async () => {
    const dataDirPath = await dataDir();
    console.log("Data directory:", dataDirPath);
    const appDataDirPath = await appDataDir();
    console.log("App data directory:", appDataDirPath);
    // const interval = setInterval(() => {
    // 	console.log('beep');
    // }, 1000);
    // setUser({
    //   id: 0,
    //   name: "John Doe",
    //   email: "foo@test.com"
    // })
    // return () => clearInterval(interval);
    users = await getUsers();
  });

  onDestroy(() => {
    console.log("the component is being destroyed");
  });

  async function getUsers() {
    try {
      const db = await Database.load("sqlite:test.db");
      const dbUsers = await db.select("SELECT * FROM users");
      console.log(dbUsers);
      // setError("");
      // setUsers(dbUsers);
      // setIsLoadingUsers(false);
      return dbUsers;
    } catch (error) {
      console.log(error);
      // setError("Failed to get users - check console");
      return [] as User[];
    }
  }

  async function addUser(user: User) {
    try {
      // setIsLoadingUsers(true);
      const db = await Database.load("sqlite:test.db");

      await db.execute("INSERT INTO users (name, email) VALUES ($1, $2)", [
        user.name,
        user.email,
      ]);

      users = await getUsers();

      // getUsers().then(() => setIsLoadingUsers(false));
    } catch (error) {
      console.log(error);
      // setError("Failed to insert user - check console");
    }
  }

  async function greet(event) {
    event.preventDefault();
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    greetMsg = await invoke("greet", { name });

    let user: User = {
      id: users.length + 1,
      name: name,
      email: email,
    };
    addUser(user);
  }
</script>

<main class="container">
  <h1>Welcome to Tauri + Svelte</h1>

  <div class="row">
    <a href="https://vitejs.dev" target="_blank">
      <img src="/vite.svg" class="logo vite" alt="Vite Logo" />
    </a>
    <a href="https://tauri.app" target="_blank">
      <img src="/tauri.svg" class="logo tauri" alt="Tauri Logo" />
    </a>
    <a href="https://kit.svelte.dev" target="_blank">
      <img src="/svelte.svg" class="logo svelte-kit" alt="SvelteKit Logo" />
    </a>
  </div>
  <p>Click on the Tauri, Vite, and SvelteKit logos to learn more.</p>

  <form onsubmit={greet}>
    <div class="row">
      <label for="name-input">Name:</label>
      <input id="name-input" placeholder="Enter a name..." bind:value={name} />
    </div>
    <div class="row">
      <label for="email-input">Email:</label>
      <input
        id="email-input"
        placeholder="Enter an email..."
        bind:value={email}
      />
    </div>

    <div class="row">
      <button type="submit">Greet</button>
    </div>
  </form>
  <p>{greetMsg}</p>

  {#each users as user, index (user)}
    <li>{index + 1}: {user.id} {user.name} {user.email}</li>
  {/each}
</main>

<style>
</style>
