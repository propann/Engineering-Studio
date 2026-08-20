# 📁 Sélecteur de dossier — File System Access API

Comment fonctionne le bouton **CHOISIR UN DOSSIER** de la fiche personnage
(`apps/studio-hub/src/pages/ProfileCreator.tsx`), et pourquoi il exige HTTPS.

---

## Le principe

Le bouton appelle `window.showDirectoryPicker()`, la seule API navigateur qui
ouvre le vrai sélecteur de dossier de l'OS et rend un
`FileSystemDirectoryHandle` — un handle qui permet d'**écrire** des fichiers
dans le dossier choisi.

C'est la seule voie possible. Un `<input type="file" webkitdirectory>` ne
convient pas : il *importe* le contenu d'un dossier en lecture seule, il ne
donne aucun droit d'écriture. C'était le bug d'origine — l'utilisateur voyait
un import de fichiers au lieu d'un choix de dossier.

---

## La contrainte : contexte sécurisé

`showDirectoryPicker` n'est **définie sur `window` que dans un contexte
sécurisé**. Hors de ce cas, la propriété est absente — pas seulement bloquée.
C'est pour ça qu'un simple `try/catch` ne suffit pas : il faut tester
l'existence.

| Origine | `window.isSecureContext` | API disponible |
|---|---|---|
| `https://nimporte-quoi` | ✅ oui | ✅ oui |
| `http://localhost:3000` | ✅ oui (exception localhost) | ✅ oui |
| `http://127.0.0.1:3000` | ✅ oui (exception localhost) | ✅ oui |
| `http://192.168.2.59:3000` | ❌ **non** | ❌ **non** |
| `file://` | ❌ non | ❌ non |

**C'était la cause du bug** : l'app était ouverte sur l'IP LAN en HTTP simple.

### Support navigateur

| Navigateur | Support |
|---|---|
| Chrome / Edge / Opera / Brave (Chromium ≥ 86) | ✅ |
| Firefox | ❌ non implémentée, quel que soit le protocole |
| Safari | ❌ non implémentée |

Sur Firefox et Safari il n'existe **aucun équivalent** : le choix de dossier
avec droit d'écriture est impossible. Il faudrait retomber sur un téléchargement
fichier par fichier.

---

## La solution retenue

Le serveur de dev Vite sert en **HTTPS** via `@vitejs/plugin-basic-ssl`
(`vite.config.ts`), ce qui rend `https://localhost:3000` **et**
`https://192.168.2.59:3000` tous les deux sécurisés.

```ts
// vite.config.ts
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: { host: "0.0.0.0", port: 3000, strictPort: true },
});
```

Le certificat est auto-signé : Chrome affiche un avertissement au premier accès
→ **Paramètres avancés** → **Continuer**. Une seule fois par navigateur.

### En production

Le conteneur Docker sert en **HTTP** (`npm run preview`) et c'est **Coolify qui
termine le TLS** via son reverse-proxy. L'app est donc servie en `https://` au
navigateur, contexte sécurisé garanti, sans certificat auto-signé.

Ne pas confondre les deux : `basicSsl()` ne concerne que le serveur de dev.

---

## Ce que fait le code

`pickWorkspaceFolder()` dans `ProfileCreator.tsx` :

1. **Teste** `"showDirectoryPicker" in window`. Si absent → alerte
   auto-diagnostique affichant `window.location.origin` et
   `window.isSecureContext`, plus la marche à suivre selon la cause.
2. **Ouvre** le sélecteur avec `{ id, mode: "readwrite", startIn: "documents" }`.
   L'`id` fait rouvrir le picker au même endroit la fois suivante.
3. **Distingue les erreurs** : `AbortError` (annulation utilisateur — silencieux)
   de `NotAllowedError`/`SecurityError` (permission refusée — alerte).
4. **Stocke le handle** dans le state `workspaceHandle`, indispensable pour
   écrire des fichiers ensuite.
5. **Crée les sous-dossiers** de `WORKSPACE_FOLDERS`, sans bloquer : les échecs
   sont collectés et rapportés en fin d'opération.

### Sous-dossiers créés

```
shared/sounds
op1/backups
op1/projects
ep133/projects
ep133/samples
drives/cloud
```

---

## Limite connue

**Le handle n'est pas persisté entre les rechargements de page.** Un
`FileSystemDirectoryHandle` n'est pas sérialisable en JSON, donc `localStorage`
ne peut pas le stocker — il faut IndexedDB, qui accepte les handles via le
structured clone.

Conséquence actuelle : après un F5, le nom du dossier disparaît et il faut le
re-sélectionner.

Une implémentation existe déjà dans le dépôt et peut être réutilisée :
`apps/ep133-studio/src/core/storage/directoryHandleStore.ts`.

À noter qu'une permission ré-obtenue après rechargement demande de toute façon
un appel à `handle.requestPermission({ mode: "readwrite" })`, qui exige un geste
utilisateur.

---

## Dépannage

L'alerte affiche systématiquement l'origine et l'état du contexte sécurisé.

| Message | Cause | Correction |
|---|---|---|
| `Contexte sécurisé : NON` | URL en `http://` sur une IP | Ouvrir en `https://` |
| `navigateur sans API File System Access` | Firefox ou Safari | Passer sur Chrome/Edge |
| Rien ne se passe au clic | Erreur JS | Ouvrir la console (F12) |
| `Permission refusée` | Refus dans la boîte de dialogue | Recliquer et accepter |

---

**Fichiers concernés**

| Fichier | Rôle |
|---|---|
| `apps/studio-hub/src/pages/ProfileCreator.tsx` | `pickWorkspaceFolder()`, state `workspaceHandle` |
| `vite.config.ts` | Plugin `basicSsl()` |
| `package.json` | `@vitejs/plugin-basic-ssl` en devDependency |
