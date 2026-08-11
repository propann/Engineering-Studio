#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;

#[derive(Debug, Serialize)]
struct AppInfo {
    name: &'static str,
    model: &'static str,
    firmware_writes_enabled: bool,
}

/// Contract initial entre l'interface et le cœur natif.
///
/// Les commandes USB, volume et firmware seront ajoutées derrière ce contrat
/// après validation des fixtures et des adaptateurs par système d'exploitation.
#[tauri::command]
fn app_info() -> AppInfo {
    AppInfo {
        name: "OP-1 Studio",
        model: "op-1-original",
        firmware_writes_enabled: false,
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![app_info])
        .run(tauri::generate_context!())
        .expect("error while running OP-1 Studio");
}
