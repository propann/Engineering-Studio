# Audit sectoriel — Engineering Studio

Date : 26 août 2026  
Référence auditée : branche `main`

## Verdict

Engineering Studio possède déjà un noyau réel : exercices OP-1, moteur audio, MIDI, projets locaux, Vault avec empreintes et vérification, éditeur EP-133 et exports. Il reste toutefois un écart entre l'outil professionnel visé et certains écrans historiques, simulations ou fonctions matérielles non validées.

La règle produit est stricte :

- **MACHINE** : échange réellement constaté avec le matériel ;
- **LOCAL** : fichier ou projet manipulé dans le navigateur ou un dossier choisi ;
- **PROFIL** : métadonnées locales du personnage et des machines ;
- **DÉMO** : interaction illustrative ;
- **NON VÉRIFIÉ** : écriture ou restauration physique sans validation reproductible.

Une fonction locale ou de démonstration ne doit jamais laisser croire qu'elle agit sur la machine.

## P0 — avant de déclarer le produit stable

1. Corriger l'intégration visuelle complète d'OP-1 Studio dans le Hub.
2. Ouvrir Rhythm Hero EP-133 directement sur le jeu, sans éditeur superposé.
3. Désactiver sur le serveur public les fonctions qui exigent le bridge Python local.
4. Retirer les faux clouds et les anciens panneaux de sauvegarde à valeurs codées en dur.
5. Protéger `main` avec la CI obligatoire.
6. Valider le déploiement Coolify sur le SHA exact.

## Hub et navigation

### Réel

- pages chargées à la demande ;
- profil local versionné ;
- dossier de travail conservé via File System Access et IndexedDB ;
- fenêtre Pages avec archivage local réversible.

### Manque

- vrai routage URL, liens directs et historique navigateur ;
- états vides plus compacts ;
- remplacement de `alert`, `confirm` et `prompt` ;
- passe responsive complète ;
- recensement automatique des pages React non montées.

## Pages et outils orphelins

L'audit n'a trouvé aucune preuve de suppression massive des pages. Les outils « perdus » sont surtout :

- des routes accessibles uniquement depuis la fenêtre Pages ;
- des composants jamais montés ;
- des doublons historiques ;
- des pages démo ou non vérifiées volontairement sorties du Hub.

L'éditeur sonore historique `SoundEditorHub.tsx` existait encore mais n'était plus monté. Il est désormais récupéré dans le routeur et classé « à connecter » dans la fenêtre Pages.

## Exercices OP-1

### Corrigé

- une colonne par touche réelle ;
- notes repliées sur MIDI 53–76 ;
- écran et clavier de même largeur ;
- écran légèrement plus haut ;
- compte à rebours calé au BPM ;
- pré-défilement : la première note part du haut au lieu d'apparaître sur la ligne de frappe ;
- métronome activable ;
- quatre exercices fondamentaux supplémentaires ;
- validation automatique du catalogue ;
- progression XP plus exigeante.

### Règles obligatoires

- identifiant unique ;
- niveau entier 1–10 ;
- BPM 40–240 ;
- au moins une note ;
- notes uniquement MIDI 53–76 après normalisation ;
- départs positifs et chronologiques ;
- durées strictement positives ;
- test automatique obligatoire avant intégration.

## Sauvegardes

Le Vault sait scanner, copier, préserver les dossiers vides, calculer SHA-256, relire, préparer une restauration et créer un point de retour.

Il manque encore :

- validation matérielle complète OP-1 ;
- restauration physique EP-133 via bridge local ;
- blocage renforcé des mauvaises destinations ;
- distinction visible entre dossier local et machine ;
- deux cartes OP-1/EP-133 toujours présentes, même sans profil configuré.

## Dette technique principale

- composants OP-1, EP-133 et Audio Rack trop volumineux ;
- plusieurs `AudioContext` indépendants ;
- `rack-bus` documenté mais insuffisamment intégré ;
- documentation et anciens dépôts encore cités ;
- tests E2E intégrés au Hub insuffisants.

## Ordre d'exécution

1. Exercices et récupération des pages.
2. Intégration visuelle OP-1.
3. Entrée Rhythm Hero EP-133.
4. Vérité des états MACHINE/LOCAL/DÉMO.
5. Sauvegardes et validations physiques.
6. Routage et polish Hub.
7. Découpage des monolithes et unification audio.
