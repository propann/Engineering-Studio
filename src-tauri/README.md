# Coque desktop Tauri

Cette coque est la cible de production de OP‑1 Studio. Le front React actuel
sert à la fois de prototype visuel et de contenu de la fenêtre Tauri.

Le pont Rust expose `app_info`, `profile_read`, `profile_write` et
`prepare_local_plan`. La commande de profil exige `confirm=true`, valide le
schéma `op1-studio-profile` et ne touche qu’au `profile.json` du coffre choisi.
Les écritures firmware, USB et machine restent désactivées.

`prepare_local_plan` accepte uniquement `firmware.plan`, `backup.plan` et
`sounds.transfer-plan`. Il renvoie un plan `op1-studio-local-bridge` avec
`machineWrite=false` et `requiresConfirmation=true`, sans lancer de processus
ni copier de fichier.

Pré-requis locaux : Rust, Cargo et la CLI Tauri 2.

```bash
npm run app:dev
npm run app:build
```
