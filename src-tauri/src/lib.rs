// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};
// use tauri_plugin_shell;

const SQLITE_PATH: &str = "sqlite:local.db";

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create core tables",
            sql: "CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT
                );

                CREATE TABLE IF NOT EXISTS protocols (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    source_code TEXT,
                    description TEXT
                );

                CREATE TABLE IF NOT EXISTS activities (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    video_guide TEXT,
                    image_guide TEXT
                );

                CREATE TABLE IF NOT EXISTS activity_protocols (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    activity_id INTEGER NOT NULL,
                    protocol_id INTEGER NOT NULL,
                    parameters TEXT,
                    created_at INTEGER NOT NULL,
                    FOREIGN KEY (activity_id) REFERENCES activities(id),
                    FOREIGN KEY (protocol_id) REFERENCES protocols(id)
                );

                CREATE TABLE IF NOT EXISTS activity_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    activity_protocol_id INTEGER NOT NULL,
                    parameters TEXT,
                    start_time TIMESTAMP NOT NULL,
                    end_time TIMESTAMP NOT NULL,
                    start_time_ms INTEGER NOT NULL,
                    end_time_ms INTEGER NOT NULL,
                    status TEXT NOT NULL,
                    notes TEXT,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (activity_protocol_id) REFERENCES activity_protocols(id)
                );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add skill progression system tables",
            sql: "CREATE TABLE IF NOT EXISTS skill_categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    color TEXT
                );

                CREATE TABLE IF NOT EXISTS activity_skills (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    activity_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    description TEXT,
                    difficulty INTEGER NOT NULL DEFAULT 1,
                    category_id INTEGER,
                    FOREIGN KEY (activity_id) REFERENCES activities(id),
                    FOREIGN KEY (category_id) REFERENCES skill_categories(id)
                );
                
                CREATE TABLE IF NOT EXISTS skill_prerequisites (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    skill_id INTEGER NOT NULL,
                    prerequisite_skill_id INTEGER NOT NULL,
                    required_mastery_level REAL DEFAULT 0.6,
                    FOREIGN KEY (skill_id) REFERENCES activity_skills(id),
                    FOREIGN KEY (prerequisite_skill_id) REFERENCES activity_skills(id)
                );
                
                CREATE TABLE IF NOT EXISTS user_skill_progress (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    skill_id INTEGER NOT NULL,
                    mastery_level REAL NOT NULL DEFAULT 0,
                    last_practiced_at INTEGER,
                    total_practice_time_ms INTEGER DEFAULT 0,
                    practice_count INTEGER DEFAULT 0,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (skill_id) REFERENCES activity_skills(id),
                    UNIQUE (user_id, skill_id)
                );
                
                -- Add a view to calculate the available skills based on prerequisites
                CREATE VIEW IF NOT EXISTS available_user_skills AS
                SELECT 
                    us.user_id,
                    s.id as skill_id,
                    s.name as skill_name,
                    s.difficulty,
                    us.mastery_level,
                    CASE 
                        WHEN us.mastery_level IS NULL THEN 0
                        WHEN p.prerequisite_count IS NULL THEN 1
                        WHEN p.prerequisites_met >= p.prerequisite_count THEN 1
                        ELSE 0
                    END as is_available
                FROM 
                    activity_skills s
                    LEFT JOIN user_skill_progress us ON s.id = us.skill_id
                    LEFT JOIN (
                        SELECT 
                            sp.skill_id,
                            COUNT(sp.prerequisite_skill_id) as prerequisite_count,
                            SUM(CASE WHEN usp.mastery_level >= sp.required_mastery_level THEN 1 ELSE 0 END) as prerequisites_met
                        FROM 
                            skill_prerequisites sp
                            LEFT JOIN user_skill_progress usp ON sp.prerequisite_skill_id = usp.skill_id
                        GROUP BY 
                            sp.skill_id, usp.user_id
                    ) p ON s.id = p.skill_id;
                    
                -- Add activity_type column to activities table
                ALTER TABLE activities ADD COLUMN activity_type TEXT DEFAULT 'exercise';
                
                -- Add complexity level to activities
                ALTER TABLE activities ADD COLUMN complexity_level INTEGER DEFAULT 1;",
            kind: MigrationKind::Up,
        }
    ];

    tauri::Builder::default()
        .setup(|app| {
            #[cfg(debug_assertions)]
            app.get_webview_window("main").unwrap().open_devtools();
            Ok(())
        })
        .plugin(tauri_plugin_os::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(SQLITE_PATH, migrations)
                .build(),
        )
        // .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}