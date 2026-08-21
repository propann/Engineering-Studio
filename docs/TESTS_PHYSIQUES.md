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

### Un sample fabriqué sonne juste
**Le plus urgent** : c'est la fonction livrée le 2026-08-21 et rien ne la valide.

Sur `https://engineering-studio.duckdns.org` — vrai HTTPS, le sélecteur y
fonctionne. Rack → déplier un moteur → choisir un dossier → OP-1 synthé, 2 s →
FABRIQUER UN SAMPLE.

À vérifier en écoutant le fichier produit, comparé au rack en direct :

- [ ] même hauteur de note
- [ ] même timbre
- [ ] **aucun claquement en fin de note** — c'est ce que le relâchement
      programmé doit empêcher ; son absence s'entend immédiatement
- [ ] pas de silence inutile en fin de fichier
- [ ] plusieurs moteurs, pas seulement Plaits — Rings et Clouds ont des
      horizons sonores très différents, ce sont eux qui éprouvent le calcul de
      durée

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
