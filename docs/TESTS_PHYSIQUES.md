# Tests physiques

Ce que les tests automatiques **ne peuvent pas** prouver : ce qui demande du
matériel branché, des oreilles, ou les deux.

366 tests tournent à chaque poussée. Aucun ne dit si un sample sonne juste, si
l'OP-1 accepte un fichier, ou si la latence est perceptible au jeu. C'est le
rôle de cette liste.

**Règle** : une case ne se coche qu'après une vérification réelle, avec la date
et ce qui a été observé. Pas « ça devrait marcher ».

---

## ✅ Vérifiés

### Lecture de l'OP-1 — 2026-08-20
Disque monté en lecture seule, 66 fichiers / 270 Mo copiés et comparés octet par
octet avec `cmp`. **0 divergence.** Catégories : tape, album, drum, synth.

### Écriture sur l'OP-1 — 2026-08-21
Sauvegarde intégrale d'abord, puis écriture d'une version différente de
`synth/user/8.aif` — **même taille, contenu différent**, précisément le cas
qu'une comparaison de tailles laisserait passer.

**L'étape qu'on oublie** : démonter et remonter avant de relire. Sans cela on
relit le cache du noyau, donc ce qu'on vient d'écrire en mémoire, et la
vérification ne prouve rien sur ce qui est réellement sur le support.

Version d'origine rétablie ensuite, 66 fichiers recontrôlés, 0 divergence.

### L'OP-1 relit son support après écriture externe — 2026-08-21
La machine fait un rapport à chaque déconnexion. Après nos écritures, ce rapport
passe normalement : écrire depuis Linux sur son volume FAT ne la déroute pas et
ne corrompt pas son système de fichiers.

### La sauvegarde du coffre écrit réellement — 2026-08-21
Confirmé par l'utilisateur sur le serveur en ligne, après correction du message
qui ne disait pas où.

Rien n'était cassé au départ : `verifierSnapshot` relit le snapshot après
écriture, donc un succès annoncé signifiait déjà que les fichiers étaient là. Le
message annonçait « 66 fichiers » sans le chemin, et le snapshot vit à trois
niveaux de profondeur — `<espace>/op1/backups/<horodatage>/files/`. Une panne de
communication, pas d'écriture, et elle coûte aussi cher : elle fait douter d'une
fonction qui marche.

### Un sample fabriqué sonne juste — 2026-08-21
**Le test qui débloquait tout.** Le rack fabrique des samples depuis ce jour et
rien ne le validait : aucun test automatique ne dit si un son est juste.

Confirmé à l'écoute par l'utilisateur. La chaîne complète tient donc — rendu
hors ligne, encodage AIFF, écriture vérifiée — et le fichier produit sonne comme
ce que le rack joue en direct.

Ce que cela valide au passage, et qui n'allait pas de soi :
- le relâchement programmé du rendu hors ligne : sans lui le fichier se coupe
  net et claque à chaque lecture
- le calcul de durée en deux passes, la sonde puis le rendu
- l'encodage AIFF, y compris le flottant étendu 80 bits de la fréquence
- le choix d'encodeur selon la cible

### Latence MIDI ressentie au jeu — 2026-08-21
**Instantané sur l'OP-1**, confirmé par l'utilisateur en jouant sur le serveur
en ligne. Aucune latence perceptible.

Cohérent avec les mesures : le transport prend 0,3 ms pour 19 notes simultanées,
et le plancher système ~1 ms. Les 20 ms visées ne sont donc jamais approchées.

*Reste optionnel : relever le chiffre exact de la ligne `LATENCE MIDI` du rack
pour connaître la répartition entre file d'attente, traitement et tampon de
sortie. Utile seulement si la latence devenait perceptible un jour.*

### Transport MIDI — 2026-08-21
30 s de jeu réel sur les pads de l'EP-133 : 166 messages, 60 frappes, notes 36
à 47.

| | |
|---|---|
| Délai entre messages consécutifs | 7 µs médiane, 58 µs au 95ᵉ centile |
| Salve de 19 notes simultanées | 0,301 ms, soit 16,7 µs par message |

Dix-neuf notes d'un coup tiennent dans **1,5 % du budget de 20 ms**. Le
transport n'est pas le sujet — tout ce qui coûte est après.

*Lire la médiane, pas la moyenne : celle-ci vaut 94 µs, tirée par un unique
écart de 3,3 ms qui est une frappe séparée, pas un retard de livraison.*

### Plancher système MIDI — 2026-08-21
Cadence de 60 notes émise à intervalle connu, horodatée à l'arrivée : gigue de
0,53 ms d'écart-type, 1,02 ms au pire, moyenne à 0,01 ms du nominal. Borne
haute — la boucle de mesure lance un processus par événement.

Méthode reproductible dans [`MESURE_LATENCE_MIDI.md`](MESURE_LATENCE_MIDI.md),
avec le piège du nominal qui fait voir une dérive de 10 ms inexistante.

---

## ⬜ À faire

### Favoris et étiquettes
Étoile à gauche de chaque patch, étiqueteur 🏷️ à droite, filtre ★ à côté de la
recherche.

- [ ] une étoile posée survit au rechargement de la page
- [ ] le filtre ★ ne montre que les patches marqués
- [ ] une étiquette posée se retrouve **par la recherche** — taper son nom
      filtre la liste
- [ ] cliquer une étiquette la retire
- [ ] les patches d'usine acceptent étoiles et étiquettes comme les patches
      perso — ce sont pourtant des constantes du source, d'où le stockage à part

### Superposition de moteurs
Pastille ronde à droite de chaque moteur non actif : elle l'empile **sur** le
moteur actif sans en changer.

- [ ] deux moteurs superposés s'entendent tous les deux
- [ ] quatre moteurs ne saturent pas — c'est ce que la compensation en racine
      du nombre de couches doit empêcher, et une saturation s'entend nettement
- [ ] un moteur à longue résonance dans l'empilement (Rings, Clouds) n'est pas
      coupé par un moteur court
- [ ] **le sample fabriqué sonne comme le direct** : c'est l'invariant qui
      compte, jeu et rendu passent par le même chemin

### Un pack chromatique est utilisable dans un DAW
Bouton « PACK C3–C7 » : 49 notes rendues d'affilée dans un sous-dossier au nom
du patch.

- [ ] les 49 fichiers sont là, correctement nommés
- [ ] chargés dans un échantillonneur de DAW, la gamme est juste d'un bout à
      l'autre — une erreur de fréquence ne s'entend que sur les extrêmes
- [ ] le rendu ne prend pas un temps déraisonnable

> ⚠️ **Ce pack ne va PAS sur l'OP-1.** Son échantillonneur synthé prend un
> fichier unique qu'il transpose, et un kit drum un fichier unique portant 24
> marqueurs. Un ensemble de 49 fichiers ne s'y charge pas : c'est un format de
> bibliothèque, pas de machine.

### Un sample fabriqué se charge sur l'OP-1
Le copier dans `synth/user/`, débrancher proprement, charger le patch sur la
machine et **l'écouter**.

C'est la seule preuve qu'on fabrique un instrument utilisable et pas seulement
des octets conformes. **Sauvegarde préalable obligatoire** — protocole dans
[`backup/PROTOCOLE_VALIDATION_RESTAURATION.md`](backup/PROTOCOLE_VALIDATION_RESTAURATION.md).

### Latence MIDI de bout en bout
Le rack affiche une ligne `LATENCE MIDI` avec trois segments : file d'attente du
navigateur, traitement, mémoire tampon de sortie.

- [ ] jouer jusqu'à ce que `n=` atteigne 20 ou 30 — une médiane sur un seul
      échantillon ne vaut rien
- [ ] relever la valeur et la comparer aux 20 ms visées
- [ ] noter lequel des trois segments domine

⚠️ **Uniquement sur `localhost` ou en HTTPS réel.** Web MIDI est indisponible
sur `http://192.168.2.59:3000` — `requestMIDIAccess` ne renvoie aucun appareil,
sans message d'erreur. Chercher une panne là serait chercher une panne qui
n'existe pas.

### Le coffre n'affiche que tes machines
Les deux colonnes s'affichaient quoi qu'il arrive : quelqu'un ne possédant
qu'une EP‑133 voyait une colonne OP‑1 vide, boutons actifs — une invitation à
sauvegarder une machine qu'il n'a pas.

- [ ] avec une seule machine déclarée, une seule colonne s'affiche, centrée
- [ ] avec les deux, les deux colonnes reviennent
- [ ] sans aucune machine déclarée, un message renvoie à la fiche de personnage
- [ ] ajouter une machine dans la fiche la fait apparaître ici

### Jauge de remplissage
- [ ] le pourcentage correspond à ce que la machine annonce elle-même
- [ ] la jauge passe en orange au-delà de 90 %

> La capacité est une **constante**, pas une mesure : le navigateur ne peut pas
> lire la taille d'un volume. 384 Mo pour l'OP‑1 (relevé matériel), 64 ou 128 Mo
> pour l'EP‑133 selon ce que dit ta fiche. D'où « sur environ ». Si le
> pourcentage semble faux, c'est le modèle déclaré dans la fiche qu'il faut
> vérifier.

### Reconnaissance du support machine
Après avoir choisi un dossier, le coffre dit s'il ressemble à la machine
attendue : « ✅ OP‑1 reconnu — tape, album, drum, synth ».

- [ ] désigner le vrai disque OP-1 → reconnu, les quatre catégories listées
- [ ] désigner un dossier quelconque → avertissement, **sans blocage**
- [ ] un OP-1 dont un dossier est vide reste reconnu — un dossier vide est un
      emplacement libre, pas une absence

> Le navigateur **ne peut pas** énumérer les disques : aucune API ne le permet,
> et c'est délibéré — une page web ne doit pas pouvoir explorer un ordinateur.
> Le sélecteur natif reste donc obligatoire. La reconnaissance se fait après
> coup, et c'est ce qui évite de désigner le mauvais dossier sans s'en
> apercevoir.

### Les dossiers vides sont copiés
Corrigé le 2026-08-21 : `collectFiles` ne rapportait que des fichiers, donc un
dossier vide n'était ni sauvegardé ni restauré. La structure revenait amputée —
et sur une OP-1 un dossier vide est un **emplacement libre**, pas une absence.

- [ ] sauvegarder une machine dont certains dossiers sont vides, puis ouvrir le
      snapshot : les dossiers vides y sont
- [ ] restaurer vers un dossier neuf : ils y sont recréés
- [ ] restaurer une seule catégorie ne recrée pas les dossiers des autres

### Restauration par l'application
Le mécanisme est validé sur matériel ; son **orchestration** ne l'est pas —
prévol, point de retour, boucle de `restoreBackup`.

Jeu d'essai à reconstruire (`_essai-coffre/` a été nettoyé) : sauvegarder depuis
l'état d'hier, restaurer vers une copie de l'état actuel.

- [ ] la boîte de confirmation annonce le bon décompte
- [ ] l'aperçu nomme les bons fichiers
- [ ] `_point-de-retour/` contient exactement les fichiers remplacés
- [ ] les fichiers inchangés ne sont pas réécrits (horodatages)

### Fiche de personnage rechargée depuis le dossier
Corrigé le 2026-08-21, jamais vérifié à la main.

- [ ] vider la fiche, re-sélectionner le dossier → elle revient seule
- [ ] avec une fiche déjà à l'écran → une confirmation est demandée avant
- [ ] au rechargement de la page, aucune fenêtre ne s'ouvre si le navigateur a
      déjà la fiche

### Recherche de patches
- [ ] taper filtre bien les 91 patches d'usine et les patches perso
- [ ] la recherche fonctionne sur les deux familles de moteurs, pas une seule

### EP-133
- [ ] lister ses sons par SysEx — aucun mode disque, tout passe par là
- [ ] un sample fabriqué à 26250 / 32000 / 46875 Hz est accepté par la machine

---

## Ce qu'on sait déjà, et qui évite de chercher au mauvais endroit

**L'OP-1 en mode disque n'a aucun port MIDI.** C'est normal, pas une panne :
elle ne présente qu'une interface *Mass Storage*. Les deux modes s'excluent.
`lsusb -v -d 2367:0002 | grep bInterfaceClass` le confirme.

**`http://192.168.2.59:3000` n'est pas un contexte sécurisé.** Ni le sélecteur
de dossier ni Web MIDI n'y sont disponibles — `showDirectoryPicker` n'y est pas
seulement bloquée, elle est **absente de `window`**. Aucun code n'y changera
quoi que ce soit. Voir [`FOLDER_PICKER.md`](FOLDER_PICKER.md).

**Le HTTPS auto-signé ne résout pas le problème, il en crée un autre.** Chrome
accorde `isSecureContext` sur un certificat en erreur mais refuse les
fonctionnalités puissantes dessus : Web MIDI y devient muet, sans message. Ça a
coûté une session entière de diagnostic.
