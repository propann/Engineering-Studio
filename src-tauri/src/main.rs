#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

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

#[derive(Debug, Serialize)]
struct LocalPlan {
    schema: &'static str,
    version: u8,
    action: String,
    #[serde(rename = "machineWrite")]
    machine_write: bool,
    #[serde(rename = "requiresConfirmation")]
    requires_confirmation: bool,
    payload: serde_json::Value,
}

/// Prépare un plan connu pour le cœur natif sans exécuter d'écriture.
#[tauri::command]
fn prepare_local_plan(action: String, payload: serde_json::Value) -> Result<LocalPlan, String> {
    if !matches!(action.as_str(), "firmware.plan" | "backup.plan" | "sounds.transfer-plan") {
        return Err("Action de bridge inconnue ou non autorisée.".into());
    }
    if !payload.is_object() {
        return Err("Le payload du bridge doit être un objet JSON.".into());
    }
    Ok(LocalPlan {
        schema: "op1-studio-local-bridge",
        version: 1,
        action,
        machine_write: false,
        requires_confirmation: true,
        payload,
    })
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

fn keyboard_path(app: &AppHandle) -> Result<PathBuf, String> {
    let directory = app.path().app_config_dir().map_err(|error| format!("Dossier de configuration inaccessible: {error}"))?;
    fs::create_dir_all(&directory).map_err(|error| format!("Création du dossier clavier impossible: {error}"))?;
    Ok(directory.join("keyboard.json"))
}

#[tauri::command]
fn keyboard_read(app: AppHandle) -> Result<Option<String>, String> {
    let path = keyboard_path(&app)?;
    if !path.exists() { return Ok(None); }
    fs::read_to_string(path).map(Some).map_err(|error| format!("Lecture du clavier impossible: {error}"))
}

#[tauri::command]
fn keyboard_write(app: AppHandle, contents: String) -> Result<(), String> {
    let value: serde_json::Value = serde_json::from_str(&contents).map_err(|error| format!("Clavier invalide: {error}"))?;
    if value.get("validated").and_then(serde_json::Value::as_array).is_none() {
        return Err("La sauvegarde clavier ne contient pas de blocs valides.".into());
    }
    let path = keyboard_path(&app)?;
    let temporary = path.with_extension("json.op1studio.tmp");
    fs::write(&temporary, format!("{}\n", contents.trim())).map_err(|error| format!("Ecriture clavier impossible: {error}"))?;
    if path.exists() { fs::remove_file(&path).map_err(|error| { let _ = fs::remove_file(&temporary); format!("Remplacement du clavier impossible: {error}") })?; }
    fs::rename(&temporary, &path).map_err(|error| { let _ = fs::remove_file(&temporary); format!("Validation du clavier impossible: {error}") })
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![app_info, profile_read, profile_write, keyboard_read, keyboard_write, prepare_local_plan])
        .run(tauri::generate_context!())
        .expect("error while running OP-1 Studio");
}
