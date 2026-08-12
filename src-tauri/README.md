# Coque desktop Tauri

Cette coque est la cible de production de OP‑1 Studio. Le front React actuel
sert à la fois de prototype visuel et de contenu de la fenêtre Tauri.

Le pont Rust expose volontairement une seule commande d’information et garde
les écritures firmware désactivées. Les prochaines commandes devront être
branchées sur les fixtures et les oracles de `tools/` avant tout essai matériel.

Pré-requis locaux : Rust, Cargo et la CLI Tauri 2.

```bash
npm run app:dev
npm run app:build
```
