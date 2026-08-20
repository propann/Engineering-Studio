# Déploiement Coolify

## Application

~~~text
Repository : propann/Engineering-Studio
Branch     : main
Root       : /
Port       : 3000
Domain     : https://engineering-studio.duckdns.org
~~~

## Commandes Coolify

Les champs Coolify contiennent uniquement la commande, sans le titre du champ.

~~~text
Install Command: bun install --frozen-lockfile
Build Command:   bun run build
Start Command:   bun run preview --host 0.0.0.0 --port 3000
~~~

Ne pas saisir Install Command: dans la valeur du champ. Cela ferait tenter
au conteneur d’exécuter une commande appelée Install.

## Proxy et santé

- Domaine public : HTTPS géré par Traefik/Let's Encrypt.
- Port interne : 3000.
- Health check activé : oui.
- Health check path : /.
- Health check scheme interne : http.

Le navigateur utilise https, mais le proxy interroge le serveur Vite dans le
conteneur en HTTP. Mettre https pour le health check interne peut provoquer
un faux échec si l’application ne chiffre pas elle-même le port 3000.

## Correction Vite obligatoire

Le domaine doit être autorisé dans preview.allowedHosts :

~~~ts
preview: {
  host: \"0.0.0.0\",
  port: 3000,
  strictPort: true,
  allowedHosts: [\"engineering-studio.duckdns.org\"],
}
~~~

## Dépannage rapide

| Symptôme | Cause probable | Action |
|---|---|---|
| npm ci réclame un lockfile | Mauvaise commande | Utiliser Bun et bun.lock |
| Install: command not found | Titre copié dans le champ | Retirer Install Command: |
| Blocked request... host not allowed | Domaine absent de Vite | Vérifier preview.allowedHosts |
| No available server | Port ou processus incorrect | Vérifier 3000 et 0.0.0.0 |
| Triangle health check jaune | Health check absent | Activer / sur le port 3000 |

## Après chaque changement

1. Pousser le commit sur main.
2. Attendre le nouveau build Coolify.
3. Ouvrir le domaine HTTPS.
4. Tester une fenêtre privée pour simuler un nouvel arrivant.
5. Vérifier la console navigateur avant de déclarer le module validé.

