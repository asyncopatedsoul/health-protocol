import Database from "@tauri-apps/plugin-sql";

type User = {
  id: number;
  name: string;
  email: string;
};

let users: User[] = $state([] as User[]);

async function getUsers() {
  try {
    const db = await Database.load("sqlite:test.db");
    const dbUsers = await db.select("SELECT * FROM users");
    console.log(dbUsers);
    // setError("");
    // setUsers(dbUsers);
    // setIsLoadingUsers(false);
    // return dbUsers;
    users = dbUsers as User[];
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

    // users = await getUsers();
    getUsers();
    // getUsers().then(() => setIsLoadingUsers(false));
  } catch (error) {
    console.log(error);
    // setError("Failed to insert user - check console");
  }
}

export function bindUsers() {
	// const { subscribe, update } = writable(0);
	// let count = $state(0);

	return {
		// subscribe,
		// increment: () => update((n) => n + 1)
		get all() { return users },
		// increment: () => count += 1
    addUser: async (user: User) => {
      await addUser(user);
    }
	};
}