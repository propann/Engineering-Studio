# 🔄 Circuit dev → test → déploiement

Comment travailler en local sans jamais publier par accident sur Coolify.

---

## La règle en une ligne

**Pousser sur `main` ne déploie rien.** Seul un push sur
`deploy/coolify-production` peut déclencher un déploiement.

---

## Pourquoi c'est sûr

Deux verrous indépendants :

**1. Le workflow GitHub Actions ne s'abonne qu'à une branche.**

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches:
      - deploy/coolify-production   # ← main n'est pas listée
```

Un `git push origin main` ne fait tourner aucun job.

**2. Coolify n'est pas encore configuré.** Aucune application n'est créée, aucun
secret (`COOLIFY_API_TOKEN`, `COOLIFY_WEBHOOK_URL`) n'est renseigné. Même le
workflow, s'il tournait, n'aurait nulle part où pousser.

Ces deux verrous restent valables tant que personne n'ajoute `main` à la liste
`branches:` du workflow.

---

## Travailler en local

```bash
npm run dev
```

Le serveur écoute en **HTTPS** :

| | URL |
|---|---|
| Local | `http://localhost:3000/` |
| Réseau | `http://192.168.2.59:3000/` |

Le HTTPS n'est pas cosmétique : l'API File System Access (sélecteur de dossier
de la fiche personnage) n'existe pas hors contexte sécurisé. Voir
[FOLDER_PICKER.md](FOLDER_PICKER.md).

Chrome affiche un avertissement de certificat auto-signé au premier accès →
**Paramètres avancés** → **Continuer**. Une seule fois par navigateur.

---

## Tester le build de production, en local

Deux niveaux, du plus rapide au plus fidèle.

### Niveau 1 — build Vite seul

```bash
npm run build     # génère dist/
npm run preview   # sert dist/ sur http://localhost:3000 (HTTP)
```

Rapide. Vérifie que le bundle se construit et se sert. Attention : `preview`
sert en **HTTP**, donc le sélecteur de dossier ne marchera pas sur une IP LAN —
utilise `localhost`, qui est un contexte sécurisé même en HTTP.

### Niveau 2 — conteneur Docker complet

C'est ce que Coolify exécutera. Le test le plus fidèle.

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f studio-hub

curl -I http://localhost:3000     # attendu : HTTP 200

docker compose down               # arrêter
```

Note : `docker compose` (plugin v2, sans tiret). L'ancien binaire
`docker-compose` n'est pas installé sur cette machine.

---

## Vérifications avant de déployer

À faire passer **avant** tout push sur la branche de déploiement :

```bash
npm run typecheck                       # doit sortir 0 erreur
npm run build                           # doit se terminer par "built in ..."
docker build -t studio-hub:verify .     # doit se terminer par "DONE"
```

Les trois passent sur `f5e75d8`.

---

## Les deux pistes tournent en parallèle

Local et Coolify ne s'excluent pas. Ce sont deux usages différents, et l'écart
de vitesse dicte lequel utiliser pour quoi.

| | Local (`npm run dev`) | Coolify |
|---|---|---|
| Voir une modif de code | **instantané** (HMR) | ~5–10 min (build + push + deploy) |
| Redémarrer | ~2 s | ~1 min |
| Accessible depuis l'extérieur | non | oui, URL publique |
| Toujours allumé | non | oui |
| Fidèle à la prod | non (HTTPS auto-signé, HMR) | oui |

**Itérer en local. Synchroniser Coolify quand il y a quelque chose à montrer**
ou à tester en conditions réelles — pas à chaque sauvegarde de fichier.

L'instance Coolify n'a pas besoin d'attendre que le projet soit « fini » : elle
peut tourner dès maintenant en parallèle du dev.

### Synchroniser l'instance Coolify

```bash
# 1. S'assurer que main est vert
git checkout main
git pull
npm run typecheck && npm run build

# 2. Reporter sur la branche de déploiement
git checkout deploy/coolify-production
git merge main

# 3. Ce push-là déclenche le CI/CD
git push origin deploy/coolify-production

# 4. Revenir bosser
git checkout main
```

Prérequis, à faire une seule fois : configurer l'application Coolify et les
secrets GitHub → [../DEPLOY_SECRETS.md](../DEPLOY_SECRETS.md).

---

## Rôle des branches

| Branche | Rôle | Déclenche un déploiement |
|---|---|---|
| `main` | Développement. Boucle rapide en local. | ❌ non |
| `deploy/coolify-production` | Ce que sert l'instance Coolify. | ✅ oui, une fois Coolify branché |

Les deux branches ont le **même contenu** aujourd'hui (`f5e75d8`), y compris les
fichiers Docker. Leur présence sur `main` ne déploie rien et ne gêne pas
`npm run dev` — elle permet au contraire de tester le conteneur depuis `main`
avant de synchroniser.

Le seul geste qui publie est le push sur `deploy/coolify-production`. Tant qu'on
ne le fait pas, on peut pousser sur `main` autant qu'on veut.

---

## Dépannage

**« Port 3000 is already in use »**

```bash
pkill -f "node.*vite"
docker compose down
lsof -i :3000 -sTCP:LISTEN    # doit ne rien retourner
```

**Le sélecteur de dossier refuse de s'ouvrir** — l'alerte affiche l'origine et
l'état du contexte sécurisé. Vérifie que l'URL commence bien par `https://`.
Détails dans [FOLDER_PICKER.md](FOLDER_PICKER.md).

**Le build casse sur `styleText`** — Node 18. Vite 8 exige **Node 20+**
(`node --version`).
