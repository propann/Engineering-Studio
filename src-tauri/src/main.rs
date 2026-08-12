#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

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

#[derive(Debug, Deserialize)]
struct ProfileEnvelope {
    schema: String,
    version: u8,
}

fn profile_path(root: &str) -> Result<PathBuf, String> {
    let root = Path::new(root);
    if !root.is_dir() {
        return Err("Le coffre du profil doit être un dossier existant.".into());
    }
    let root = root.canonicalize().map_err(|error| format!("Coffre inaccessible: {error}"))?;
    Ok(root.join("profile.json"))
}

/// Lit uniquement le profile.json du coffre choisi par l'utilisateur.
#[tauri::command]
fn profile_read(root: String) -> Result<String, String> {
    let path = profile_path(&root)?;
    fs::read_to_string(path).map_err(|error| format!("Lecture du profil impossible: {error}"))
}

/// Ecrit un profil valide après confirmation explicite de l'interface.
#[tauri::command]
fn profile_write(root: String, contents: String, confirm: bool) -> Result<(), String> {
    if !confirm {
        return Err("Confirmation requise pour écrire profile.json.".into());
    }
    let path = profile_path(&root)?;
    if path.is_symlink() {
        return Err("profile.json lié symboliquement refusé.".into());
    }
    let envelope: ProfileEnvelope = serde_json::from_str(&contents).map_err(|error| format!("JSON profil invalide: {error}"))?;
    if envelope.schema != "op1-studio-profile" || envelope.version != 1 {
        return Err("Schéma profile.json non supporté.".into());
    }
    let temporary = path.with_extension("json.op1studio.tmp");
    fs::write(&temporary, format!("{}\n", contents.trim())).map_err(|error| format!("Écriture temporaire impossible: {error}"))?;
    if path.exists() {
        fs::remove_file(&path).map_err(|error| { let _ = fs::remove_file(&temporary); format!("Remplacement du profil impossible: {error}") })?;
    }
    if let Err(error) = fs::rename(&temporary, &path) {
        let _ = fs::remove_file(&temporary);
        return Err(format!("Remplacement du profil impossible: {error}"));
    }
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![app_info, profile_read, profile_write])
        .run(tauri::generate_context!())
        .expect("error while running OP-1 Studio");
}
