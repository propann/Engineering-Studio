# La fiche de personnage — concept de profil local

Document d'organisation, pas de code. Idée posée le 12 août 2026 : ajouter
une **fiche de personnage** — un profil qui regroupe les données saisies par
l'utilisateur, l'espace à partager, le disque et la ou les pseudo-machines —
et **la faire tourner entièrement en local pour l'instant**. La gestion de
compte (authentification, réseau, Studio Cloud) est explicitement reportée :
« on verra pour faire la gestion des comptes par la suite ». Priorité
confirmée : local d'abord, ce document sert juste à ne pas perdre l'idée.

## Ce que c'est, en une phrase

Une fiche locale, un seul fichier, aucun compte : elle donne un nom à
« l'atelier » de l'utilisateur (qui il est, quelles machines il a, combien
d'espace il utilise, ce qu'il a marqué comme partageable) sans jamais exiger
de réseau ni de mot de passe pour fonctionner.

## Pourquoi maintenant plutôt qu'avec les comptes (M6)

`BUSINESS_MODEL.md` prévoit déjà un compte optionnel pour **Studio Cloud**
(sync, partage privé, historique distant) et `ROADMAP.md` le place au jalon
**M6**, après validation de la rétention — donc pas maintenant. Construire la
fiche locale avant le compte a un avantage concret : le jour où M6 démarre,
la fiche locale devient le brouillon à importer dans un compte réel, au lieu
de devoir inventer la forme des données sous pression au moment de brancher
l'authentification. Ça évite aussi de bloquer une fonction locale utile
(nommer sa machine, voir son espace disque) derrière un jalon qui n'a pas
encore de date.

## Contenu de la fiche

| Champ | Rôle | Local uniquement pour l'instant |
|---|---|---|
| `pseudo` | nom choisi par l'utilisateur, purement d'affichage — **pas un identifiant réseau, pas un login** | oui |
| `machines[]` | une entrée par OP-1 pseudo-nommé (« mon OP-1 », « OP-1 de secours ») | oui |
| `espaceLocal` | dossier racine du coffre (`backupRoot` déjà présent dans l'UI Sauvegardes), taille utilisée, taille disponible mesurée sur le disque réel | oui |
| `espacePartage` | sélection explicite de projets/fichiers marqués « partageables plus tard » (Tape, Album, patches) — reste un simple marqueur local, **aucun envoi réseau tant qu'aucun compte n'existe** | oui |
| `preferences` | langue, disposition clavier (AZERTY/QWERTY, cf. M4.5), thème visuel | oui |
| `journal` | renvoie vers `OperationJournal` déjà prévu dans `ARCHITECTURE.md`, pas dupliqué ici | oui (référence) |

### `machines[]` — la pseudo-machine

Chaque entrée est un **nom donné par l'utilisateur**, pas une nouvelle
identité technique : elle pointe vers le `DeviceIdentity` déjà défini dans
`ARCHITECTURE.md` (modèle, mode, point de montage, identifiants USB
observés) plutôt que de le redéfinir. La fiche ajoute seulement ce que
`DeviceIdentity` n'a pas de raison de porter :

| Sous-champ | Exemple |
|---|---|
| `nom` | « OP-1 studio », « OP-1 de secours » |
| `deviceIdentityRef` | lien vers la dernière identité technique observée pour cette machine |
| `dernierSnapshot` | référence au dernier `BackupManifest` associé |
| `notes` | libre, local, jamais envoyé |

Objectif : permettre plusieurs OP-1 sans compte ni serveur — utile dès
maintenant pour quelqu'un qui a une machine principale et une machine de
secours, sans attendre le multi-machine payant prévu dans
`BUSINESS_MODEL.md` (« profils et diagnostics historiques de plusieurs
machines », actuellement rangé côté Studio Cloud).

## Où ça vit tant qu'il n'y a pas de compte

Un seul fichier local, cohérent avec la section « Stockage de configuration »
de `ARCHITECTURE.md` (préférences : configuration applicative native, sans
secret) :

```text
OP-1 Studio Backups/
└── profile.json       <- la fiche, un seul fichier, pas de base
```

Pas de SQLite pour ça : la fiche est petite, lue au démarrage, écrite à
chaque changement. L'index SQLite local prévu par `ARCHITECTURE.md` reste
réservé à la bibliothèque Sons (recherche/filtre), un besoin différent.

## Ce que la fiche ne fait pas (aujourd'hui)

- pas d'authentification, pas de mot de passe, pas de session ;
- pas de synchronisation réseau — `espacePartage` est un marqueur local, pas
  un envoi ;
- pas de compte multi-appareils — un `profile.json` par installation locale ;
- ne remplace pas `DeviceIdentity`/`BackupManifest`, elle les référence.

## Passerelle vers M6 (pour plus tard, pas maintenant)

Quand la gestion de comptes démarrera :

1. `pseudo` devient un nom d'affichage lié à un vrai compte, sans changer de
   forme ;
2. `espacePartage` devient le point d'entrée du partage privé déjà décrit
   dans `BUSINESS_MODEL.md` ;
3. `machines[]` devient les « profils de machine » de l'offre Studio Cloud ;
4. `profile.json` local reste la source de vérité hors-ligne — le compte
   synchronise dessus, il ne le remplace pas (cohérent avec la règle d'or :
   l'app doit rester utilisable sans jamais activer la synchronisation).

## Référence croisée

[`ARCHITECTURE.md`](ARCHITECTURE.md) (modèles `DeviceIdentity`,
`BackupManifest`, `OperationJournal`) · [`BUSINESS_MODEL.md`](BUSINESS_MODEL.md)
(Studio Cloud, partage privé, profils multi-machines) ·
[`APP_SCOPE.md`](APP_SCOPE.md) · [`TOOLING_GAP_ANALYSIS.md`](TOOLING_GAP_ANALYSIS.md)
(section 3 — pile Cloudflare/D1 réservée au futur service, pas à cette fiche
locale)
