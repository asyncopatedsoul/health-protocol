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
    let migrations = vec![Migration {
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
                parameters TEXT,
                description TEXT,
                video_guide TEXT,
                image_guide TEXT
            );
            
            CREATE TABLE IF NOT EXISTS activity_history (  
                id INTEGER PRIMARY KEY AUTOINCREMENT,  
                user_id INTEGER NOT NULL, 
                activity_id INTEGER NOT NULL, 
                protocol_id INTEGER NOT NULL, 
                start_time INTEGER NOT NULL,
                end_time INTEGER NOT NULL,
                status TEXT NOT NULL,
                notes TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id),
				FOREIGN KEY (activity_id) REFERENCES activities(id),
				FOREIGN KEY (protocol_id) REFERENCES protocols(id)
            );",
        kind: MigrationKind::Up,
    },
    ];

    

    tauri::Builder::default()
        .setup(|app| {
            #[cfg(debug_assertions)]
            app.get_webview_window("main").unwrap().open_devtools();
            Ok(())
        })
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
