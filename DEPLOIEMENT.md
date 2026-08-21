# Déploiement

Document unique, issu de la fusion de quatre pages — `DEPLOYMENT.md`,
`DEPLOY_README.md`, `DEPLOY_SECRETS.md` et `docs/guides/COOLIFY_DEPLOYMENT.md`,
1618 lignes au total. Vérifié ligne à ligne contre le dépôt le 2026-08-21, et
contre le site en ligne, qui répond bien en HTTP/2.

## L'installation réelle

```
Dépôt    : propann/Engineering-Studio
Branche  : main            ← ce que Coolify suit
Racine   : /
Port     : 3000
Domaine  : https://engineering-studio.duckdns.org
```

**Ce qui a été retiré et pourquoi** : les trois documents décrivaient des
dispositifs qui n'existent pas ici — Kubernetes, Docker Swarm, Sentry, alertes
Slack, migrations de base de données, services de surveillance externes. Et
`DEPLOY_SECRETS.md` détaillait sur 477 lignes la configuration de trois secrets
GitHub qui ont été **supprimés du CI** parce qu'ils n'avaient jamais été
renseignés. Suivre ces pages faisait perdre du temps sur des étapes sans objet.

---

## ⚠️ Coolify déploie une branche que le CI ne teste pas

C'est le point le plus important de cette page, et il tient en deux lignes :

| | Branche |
|---|---|
| Ce que **Coolify** déploie | `main` |
| Ce que le **CI** teste | `deploy/coolify-production` |

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches:
      - deploy/coolify-production
```

Les deux ne se rencontrent jamais. **Ce qui part en production n'est jamais
passé par le CI**, et ce que le CI vérifie n'est déployé nulle part. Mesuré le
2026-08-21 : `main` avait 9 commits d'avance sur la branche de déploiement.

Les tests tournent bien — en local, à la main. Mais rien d'automatique ne
protège la production. Tant que ce n'est pas résolu, **considérer que le CI ne
protège rien**.

Deux façons d'en sortir, à trancher explicitement :

1. **Ajouter `main` aux branches déclencheuses** — le CI valide alors ce qui
   est réellement déployé. C'est le plus direct, puisque Coolify suit `main`.
2. **Faire déployer Coolify depuis `deploy/coolify-production`** et n'y
   fusionner que du vérifié. Plus strict, mais impose une étape à chaque
   livraison.

---

## Ce que fait réellement le CI

Trois travaux, dans cet ordre :

| Travail | Étapes |
|---|---|
| `test` | Bun · install `--frozen-lockfile` · `typecheck` · `test` · `build` |
| `build` | Buildx · connexion au registre GitHub · construction et poussée de l'image |
| `security-scan` | Trivy · téléversement du rapport |

**Aucun secret manuel n'est requis.** Le seul référencé est
`secrets.GITHUB_TOKEN`, fourni automatiquement par GitHub. Il n'y a rien à
créer, ni jeton personnel, ni jeton Coolify, ni webhook Slack — c'est
exactement ce que l'ancien `DEPLOY_SECRETS.md` demandait de faire pour rien.

---

## Coolify

Coolify surveille le dépôt et déploie tout seul. Le CI construit l'image ; il
ne pilote pas Coolify.

### Champs Coolify

Les champs ne contiennent **que la commande**, jamais le libellé :

```
Install Command : bun install --frozen-lockfile
Build Command   : bun run build
Start Command   : bun run preview --host 0.0.0.0 --port 3000
```

> Ne pas recopier `Install Command:` dans la valeur du champ — le conteneur
> tenterait d'exécuter une commande nommée `Install`. Erreur déjà rencontrée.

### Contrôle de santé

- Activé, chemin `/`, port 3000
- **Schéma interne : `http`**, pas `https`

Le navigateur passe en HTTPS, mais le proxy interroge le serveur *dans* le
conteneur, qui ne chiffre pas le port 3000. Mettre `https` ici provoque un
échec de santé alors que l'application va bien.

### Le domaine doit être déclaré à Vite

Sans quoi Vite refuse les requêtes du proxy avec
`Blocked request... host not allowed`.

```ts
// vite.config.ts
preview: {
  host: "0.0.0.0",
  port: 3000,
  strictPort: true,
  allowedHosts: ["engineering-studio.duckdns.org"],
}
```

**Tout nouveau domaine doit être ajouté ici**, sinon le déploiement se construit
correctement puis sert une erreur.

### TLS, et pourquoi ça compte ici

Le conteneur sert en HTTP ; **c'est Coolify qui termine le TLS** via son
proxy inverse. Le navigateur reçoit donc du `https://`.

Ce n'est pas un détail cosmétique. Deux fonctions du Hub exigent un **contexte
sécurisé** :

| Origine | Sélecteur de dossier | Web MIDI |
|---|---|---|
| `https://domaine` (Coolify) | ✅ | ✅ |
| `http://localhost:3000` | ✅ (exception localhost) | ✅ |
| `http://192.168.2.59:3000` | ❌ | ❌ |

Sur une IP en HTTP simple, `showDirectoryPicker` n'est pas bloquée : elle est
**absente de `window`**, et `requestMIDIAccess` ne renvoie aucun appareil, sans
message d'erreur. Aucun code n'y changera quoi que ce soit. Voir
`docs/FOLDER_PICKER.md`.

> **Ne pas « corriger » cela avec un certificat auto-signé.** Chrome accorde
> bien `isSecureContext` sur une origine dont le certificat est en erreur, mais
> refuse les *fonctionnalités puissantes* dessus. Le plugin
> `@vitejs/plugin-basic-ssl` a été retiré du serveur de dev pour cette raison :
> il rendait Web MIDI muet, et le diagnostic a coûté une session entière.

---

## Construction locale

L'image est en deux étapes, sous `oven/bun:1-alpine` — le dépôt est sous
`bun.lock`, `npm ci` ne peut pas fonctionner ici.

```bash
docker build -t studio-hub:latest .
docker run -d --name studio-hub -p 3000:3000 studio-hub:latest
```

Ou par compose, qui ajoute le redémarrage automatique, les limites de
ressources, la rotation des journaux et le contrôle de santé :

```bash
docker compose up -d
docker compose logs -f
docker compose down
```

Le conteneur tourne sous un utilisateur non privilégié (`appuser`, uid 1001) et
porte son propre `HEALTHCHECK` — intervalle 30 s, délai de grâce 40 s, trois
tentatives.

### Reproduire le CI à l'identique

Utile avant de pousser : c'est l'environnement exact du CI.

```bash
docker run --rm -v "$PWD":/src -w /src oven/bun:1-alpine \
  sh -c "bun install --frozen-lockfile && bun run test"
```

---

## Variables d'environnement

`.env.production` existe à la racine, **n'est pas suivi par git**, et porte 24
valeurs. Les noms :

```
NODE_ENV APP_NAME APP_VERSION VITE_APP_TITLE VITE_API_URL VITE_API_TIMEOUT
AUDIO_CONTEXT_SAMPLE_RATE AUDIO_MAX_POLYPHONY LOG_LEVEL LOG_FORMAT
CORS_ORIGIN SECURE_COOKIES ALLOW_INSECURE_LOCALHOST FEATURE_AUDIO_EXPORT
FEATURE_SAMPLE_PACKS FEATURE_PATCH_SHARING FEATURE_CLOUD_SYNC MAX_PATCH_SIZE
MAX_UPLOAD_SIZE CACHE_DURATION ANALYTICS_ENABLED SENTRY_DSN STORAGE_TYPE
BACKUP_ENABLED SUPPORT_EMAIL
```

Deux avertissements de lecture :

- **`SENTRY_DSN` et `ANALYTICS_ENABLED` ne sont branchés à rien.** Aucun code
  ne les lit. Les documents précédents décrivaient une intégration Sentry
  complète qui n'existe pas.
- Les indicateurs `FEATURE_*` décrivent des fonctions prévues, pas livrées.

Seules les variables préfixées `VITE_` atteignent le navigateur ; elles sont
figées **au moment de la construction**, pas au démarrage. En changer une
impose de reconstruire l'image.

---

## Vérifier un déploiement

```bash
curl -I https://<domaine>                 # 200 attendu
docker inspect --format='{{.State.Health.Status}}' studio-hub   # healthy
docker stats --no-stream studio-hub
```

Puis, dans le navigateur — ce que `curl` ne peut pas voir :

1. Le rack audio démarre et produit du son (un clic est nécessaire :
   `AudioContext` reste suspendu tant qu'aucun geste n'a eu lieu)
2. Web MIDI voit les appareils branchés — **uniquement en `https://`**
3. Le sélecteur de dossier ouvre bien la fenêtre native

---

## Pannes réelles

Celles-ci sont arrivées dans ce projet. Les autres ont été retirées.

### La construction casse sur `styleText`

Node 18. Vite 8 utilise `node:util#styleText`, absent avant Node 20. Le
Dockerfile et le CI sont sous Bun, donc concernés seulement si quelqu'un
construit hors conteneur.

### `npm ci` échoue dans le conteneur

Attendu : il n'y a plus de `package-lock.json` suivi, le dépôt est sous
`bun.lock`. Utiliser `bun install --frozen-lockfile`.

> Piège vérifié le 2026-08-21 : npm régénère `package-lock.json` dès qu'on
> lance `npm test` ou `npm run build`, et un `git add -A` le ramène dans le
> dépôt sans qu'on le remarque. C'est arrivé une fois, dans le commit censé
> justement supprimer ce doublon. Le fichier est désormais dans `.gitignore` ;
> ne pas l'en retirer.

### Le conteneur ne démarre pas

```bash
docker logs studio-hub
```

Port 3000 déjà pris, ou mémoire insuffisante à la construction.

### Le contrôle de santé échoue

```bash
docker exec studio-hub wget -qO- http://localhost:3000
```

Si la réponse est bonne à l'intérieur mais pas à l'extérieur, le problème est
la publication du port ou le proxy, pas l'application.

### Symptômes Coolify, rencontrés pour de vrai

| Symptôme | Cause | Action |
|---|---|---|
| `npm ci` réclame un lockfile | mauvaise commande | Bun et `bun.lock` |
| `Install: command not found` | libellé recopié dans le champ | retirer `Install Command:` |
| `Blocked request... host not allowed` | domaine absent de Vite | `preview.allowedHosts` |
| `No available server` | port ou interface | 3000 et `0.0.0.0` |
| Triangle jaune sur la santé | contrôle absent ou en `https` | activer `/` en `http`, port 3000 |

### Web MIDI ne voit aucun appareil

Dans l'ordre :

1. L'origine est-elle un contexte sécurisé ? (voir le tableau plus haut)
2. Le système voit-il les appareils ? `amidi -l`
3. Émettent-ils ? `aseqdump -p <client>:0` pendant qu'on joue

Un appareil visible par ALSA mais absent du navigateur désigne presque
toujours le contexte sécurisé. Mesures de référence dans
`docs/MESURE_LATENCE_MIDI.md` : le transport ALSA livre 19 notes simultanées en
0,3 ms, il n'est donc jamais la cause d'une latence perçue.

---

## Mettre à jour

```bash
git push origin main                              # Coolify reconstruit et redéploie
git push origin main:deploy/coolify-production    # déclenche le CI (tests, image, Trivy)
```

Les deux sont nécessaires **tant que la divergence signalée en tête de page
n'est pas résolue** : la première livre, la seconde vérifie.

Après chaque changement :

1. Attendre la fin de la construction Coolify
2. Ouvrir le domaine HTTPS
3. Rouvrir en **fenêtre privée** — c'est ce que voit un nouvel arrivant, sans
   `localStorage` ni permissions déjà accordées
4. Regarder la console du navigateur avant de déclarer le module validé

Pour revenir en arrière : onglet *Deployments* de Coolify, redéployer une
version précédente.

---

## `scripts/deploy.sh`

Le script existe et gère construction, cycle de vie du conteneur et
vérification de santé. Il n'est pas utilisé par le CI, qui appelle directement
Docker. Le garder pour un déploiement manuel sur une machine sans Coolify.

---

## Fichiers de référence

| Fichier | Rôle |
|---|---|
| `Dockerfile` | image en deux étapes, bun, utilisateur non privilégié |
| `docker-compose.yml` | exécution locale complète |
| `coolify.json` | métadonnées, port, contrôle de santé |
| `.env.production` | variables, non suivi par git |
| `.github/workflows/deploy.yml` | test, construction, analyse de vulnérabilités |
| `scripts/deploy.sh` | déploiement manuel |
