# Tests physiques

Ce que les tests automatiques **ne peuvent pas** prouver : ce qui demande du
matériel branché, des oreilles, ou les deux.

La suite complète tourne à chaque poussée. Aucun ne dit si un sample sonne juste, si
l'OP-1 accepte un fichier, ou si la latence est perceptible au jeu. C'est le
rôle de cette liste.

**État au 2026-08-21** : 9 vérifications faites, 9 en attente.

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

### La fiche de personnage se recharge depuis le dossier — 2026-08-21
Confirmé : elle se reconfigure dès que le dossier est sélectionné.

Le défaut d'origine : la fiche était écrite à deux endroits — le localStorage du
navigateur ET `profile_<NOM>.json` dans le dossier — mais relue depuis un seul.
Vider les données effaçait la fiche, et re-choisir le dossier retrouvait le
fichier sans jamais l'ouvrir. Le bouton « supprimer la fiche locale » promettait
pourtant que « le fichier déjà écrit dans le dossier restera intact » :
l'intention était bien qu'il serve de recours, la fonction de relecture n'avait
simplement jamais été écrite.

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

### Jouer l'OP-1 en mode contrôleur, partout
L'OP-1 en **COM → T2 / CTRL**, branchée en USB. Le but : que la machine joue
chaque surface du hub qui produit du son.

- [ ] **Rack de moteurs** — le clavier de l'OP-1 joue les 15 moteurs
- [ ] **Créateur de patch** (Édition & Création de Son) — le clavier joue la
      synthèse FM en direct. **Aucune notification ne doit apparaître par
      touche** : elles sont coupées pour les notes MIDI, sinon jouer une gamme
      masquerait la page
- [ ] **Éditeur sonore** — une touche rejoue le son sélectionné. C'est un banc
      d'écoute, pas un instrument : la hauteur ne change rien, et **le trim en
      cours ne doit pas être remis à zéro**
- [ ] **Rack MIDI** — mode contrôleur actif, l'OP-1 choisit les notes de
      l'arpège au lieu de les jouer
- [ ] **le studio EP-133 joue ses pads au clavier de l'OP-1.** C'était le
      manque : le studio filtrait ses entrées sur les ports nommés « EP-133 »,
      donc l'OP-1 était écartée **par construction**. Do1 = pad 1
- [ ] **et sans ouvrir l'éditeur.** Le pont du hub ne servait que l'éditeur ;
      un clavier branché doit jouer quoi qu'il arrive
- [ ] le studio OP-1 reçoit toujours le MIDI
- [ ] **passer d'une page à l'autre dix fois, en jouant à chaque fois.** C'est
      le test du répartiteur : `onmidimessage` est une propriété unique, et
      une seule écriture directe rendrait toutes les autres pages muettes —
      sans aucune erreur
- [ ] **note-off déguisé** : tenir une touche longtemps puis relâcher. Si une
      note reste tenue indéfiniment, c'est un `0x90` vélocité 0 pris pour un
      note-on
- [ ] l'horloge et les messages de contrôleur continu de l'OP-1 **ne déclenchent
      aucune note** — la page ne doit pas jouer à chaque tic


### Le rack ouvert depuis le studio EP‑133
Onglet **RACK** dans la barre de l'éditeur, à côté de PATTERNS et SONG.

- [ ] l'onglet ouvre le rack : moteurs, patches, effets, tout est là
- [ ] **jouer sur la machine pendant que le rack est ouvert** : les deux
      reçoivent le MIDI. C'est ce que le répartiteur existe pour garantir
- [ ] **revenir sur PATTERNS puis rejouer** : le studio reçoit toujours. C'est
      le nettoyage destructeur qu'on a corrigé — avant, quitter le rack coupait
      le MIDI de la page restante
- [ ] `Ctrl+D` dans l'éditeur duplique **sans** jouer de note
- [ ] taper une lettre en vue PATTERNS ne joue aucune note du rack
- [ ] **aller et venir dix fois entre les onglets : le son marche toujours.**
      C'est le test de la fuite d'AudioContext, corrigée le 2026-08-22 : le rack
      en créait un par ouverture sans jamais le fermer, et Chrome en plafonne six
      par document. Au septième, plus aucun son et aucune erreur — donc si ça
      casse, ça casse *silencieusement*. Aucun test automatique ne peut le voir :
      il faudrait un vrai navigateur et sept montages
- [ ] fabriquer un sample depuis le rack ouvert dans le studio

### Le rack ouvert depuis le studio OP‑1
Menu **vue** → « Afficher Rack Audio ». Le panneau part **replié**,
contrairement à l'écran OLED et au clavier machine.

- [ ] le panneau s'ouvre et le rack est entier : moteurs, patches, effets
- [ ] **il a une hauteur visible.** Le rack embarqué demande `height: 100%` et la
      page OP‑1 est une colonne qui défile : sans hauteur sur le parent, le
      panneau existe mais rend un rack de hauteur nulle. Un test verrouille la
      règle CSS, il ne peut pas voir le résultat
- [ ] **replié, le clavier de l'ordinateur ne joue aucune note.** Les écouteurs
      du rack sont posés sur `window` : ils survivraient au repli
- [ ] `Espace` pilote toujours la lecture de l'OP‑1, rack ouvert
- [ ] **jouer sur l'OP‑1 pendant que le rack est ouvert** : les deux reçoivent le
      MIDI
- [ ] **refermer puis rejouer sur l'OP‑1** : le studio reçoit toujours
- [ ] ouvrir et fermer dix fois : le son marche toujours (même fuite que
      ci‑dessus, même correctif)

### Delay calé sur le tempo du studio
Bouton **SYNC** sous le curseur TEMPS du delay, avec le choix de division.

- [ ] SYNC affiche le BPM du studio hôte, pas 120. **Si l'affichage reste à 120,
      c'est que `hub:transport` n'arrive pas** — le rack garde alors sa valeur par
      défaut sans rien signaler
- [ ] changer le tempo du studio déplace le temps de delay, à l'oreille
- [ ] les répétitions retombent **juste** sur le rythme joué. C'est le seul juge :
      un calcul exact qui sonne décalé signalerait un problème de latence
      ailleurs, pas de conversion
- [ ] 1/8 et 1/8T s'entendent différemment, et le triolet swingue
- [ ] SYNC actif, le curseur TEMPS est **grisé** et ne bouge plus
- [ ] SYNC éteint, le curseur reprend la main sur la dernière valeur calculée
- [ ] **un sample fabriqué SYNC actif porte le delay calé** — pas l'ancienne
      valeur. Le recalage passe par `updateParam` exprès pour ça ; c'est l'écart
      qu'aucun test structurel ne peut entendre


### Effets globaux — delay et égaliseur
Panneau au-dessus de l'oscilloscope. Ils s'appliquent **après** les moteurs,
donc à la superposition entière.

- [ ] le delay s'entend, et le mélange à 0 % le fait disparaître complètement
- [ ] le retour à 100 % ne part **jamais** en larsen — la réinjection est bornée
      à 0,85, un curseur au maximum ne doit pas pouvoir faire diverger la boucle
- [ ] les répétitions du delay ne deviennent pas stridentes : la boucle est
      amortie
- [ ] l'égaliseur s'entend sur les trois bandes
- [ ] **un sample fabriqué porte les mêmes effets que ce qu'on entend** — c'est
      l'invariant qui compte, jeu et rendu passent par la même chaîne

### Le rack MIDI — arpégiateur et gammes
Page **Réglages → Synchronisation MIDI**. Les notes choisies partent vers tout
ce qui écoute : le rack de moteurs, l'OP‑1, l'EP‑133, les machines branchées.

- [ ] **le rack de moteurs sonne.** C'était le blocage : seuls les studios
      écoutaient `hub:midi-note`. Ouvre le rack dans un studio, lance l'arpège
      depuis le hub — le rack doit jouer
- [ ] l'arpège atteint aussi l'OP‑1 et l'EP‑133 en même temps
- [ ] les six motifs s'entendent différemment. **Montant-descendant ne répète
      pas les extrémités** : sur do‑mi‑sol on entend do mi sol mi, pas
      do mi sol sol mi do
- [ ] **la pentatonique change vraiment les notes.** Tiens un do# en
      pentatonique majeure de do : il doit sonner do, pas do#
- [ ] changer le tempo **pendant que l'arpège tourne** : la vitesse suit
      immédiatement. Si elle ne bouge qu'au clic suivant, le relevé des
      réglages ne fonctionne pas
- [ ] **aucune note suspendue.** Arrêter l'arpège, quitter la page, appuyer sur
      PANIC en pleine course : la machine doit se taire à chaque fois. C'est le
      défaut qui oblige à débrancher pour s'en sortir
- [ ] mode contrôleur actif : l'OP‑1 **choisit** les notes, elle ne les joue
      plus. Une touche ne doit pas sonner deux fois
- [ ] une note jouée au clavier physique **et** arpégée ne se coupe pas
      elle-même (préfixes de voix distincts)

### Séquenceur pas à pas
Sous l'arpégiateur, dans le rack MIDI.

- [ ] **la phrase part vers tout ce qui écoute** — le rack de moteurs, l'OP-1,
      l'EP-133, les machines branchées
- [ ] les quatre sens s'entendent. **Aller-retour ne rejoue pas les extrémités
      deux fois** : sur 4 pas, on entend 1 2 3 4 3 2, pas 1 2 3 4 4 3 2 1
- [ ] **éteindre un pas garde sa note** : le rallumer rejoue la même
- [ ] un pas vide (—) fait un silence, pas une note à zéro
- [ ] **changer de gamme pendant la lecture s'entend tout de suite.** Si ça
      n'arrive qu'au clic suivant, le relevé des réglages ne fonctionne pas
- [ ] passer de 16 pas à 8 puis revenir à 16 : **la fin de la phrase est
      toujours là**
- [ ] **aucune note suspendue** : arrêter, quitter la page, PANIC en pleine
      lecture. La machine doit se taire à chaque fois
- [ ] PANIC arrête l'arpégiateur **et** le séquenceur
- [ ] transposer très haut tasse contre l'aigu, ça ne réapparaît pas en bas
- [ ] arpégiateur et séquenceur **en même temps** : les deux jouent sans se
      couper l'un l'autre


### Les 30 gammes et le sélecteur
Menu **Gamme** du rack MIDI, groupé par familles.

- [ ] les sept familles apparaissent comme des groupes dans le menu
- [ ] taper « dor » au clavier menu ouvert saute à Dorien — c'est pour ça que
      c'est un `<select>` natif et pas un menu maison
- [ ] **chaque famille sonne différemment.** Le test qui compte : tenir un
      accord, passer de pentatonique mineure à Hongroise mineure sans rien
      toucher d'autre. Si ça sonne pareil, la quantification ne s'applique pas
- [ ] la chromatique ne change **rien** — c'est « aucune contrainte »
- [ ] changer de tonique déplace bien la gamme entière


### Enveloppe ADSR
Panneau ENVELOPPE du rack de moteurs.

- [ ] **les 76 patches d'usine sonnent comme avant.** Les défauts reproduisent
      exactement les valeurs câblées jusqu'ici ; si un patch connu sonne
      différemment, la valeur par défaut a bougé
- [ ] attaque longue : la note monte progressivement, sans clic au départ
- [ ] **maintien à 0 % : la note s'éteint après le déclin, sans erreur.** C'est
      la borne qui compte — les rampes sont exponentielles et le nœud refuse
      zéro. Une exception ici serait au premier appui sur une touche
- [ ] relâchement long : la queue se prolonge après le lâcher de touche
- [ ] attaque, déclin et relâchement à 0 : **aucun clic**. Une rampe de durée
      nulle remet le gain d'un coup, ce que l'enveloppe existe pour éviter
- [ ] **un échantillon fabriqué porte l'enveloppe réglée** — pas celle par
      défaut


### Import de patch
Bouton **📥 IMPORTER** à côté des trois exports.

- [ ] **aller-retour complet** : exporter en JSON, changer de moteur, réimporter
      — les réglages reviennent et les curseurs suivent
- [ ] les trois formats se relisent : JSON standard, OP-1 SYNTH, EP-133 MAP
- [ ] **réimporter deux fois le MÊME fichier fonctionne.** Sans remise à zéro
      du champ, le second choix ne déclenche rien et on croit à un échec
- [ ] un fichier qui n'est pas un patch donne un message clair, pas un rack vide
- [ ] un patch d'un moteur inconnu est refusé en le nommant
- [ ] le patch importé apparaît comme patch **utilisateur**, pas parmi les 76
      d'usine


### LFO global
Panneau LFO du Labo, à côté de l'enveloppe.

- [ ] **CIBLE sur « — Aucun — » : le son est strictement celui d'avant.** Le
      défaut ne module rien, sinon les 76 patches d'usine changeraient
- [ ] **trémolo** : le volume pulse. À profondeur maximale, il ne doit
      **jamais** se taire ni craquer — le creux reste au-dessus de zéro, sans
      quoi le gain n'atténue pas mais **inverse la phase**
- [ ] **superposition de patches + trémolo à fond** : c'est là que l'inversion
      de phase s'entendrait — deux voix en opposition s'annulent
- [ ] **filtre** : le balayage s'entend, et à profondeur maximale il ne coupe
      **jamais** tout. Un trou de son au lieu d'un balayage signale que le
      plancher a sauté
- [ ] les quatre formes diffèrent : le carré saute, la dent de scie retombe
- [ ] **SYNC** : le LFO se cale sur le tempo du studio, et la vitesse affichée
      en Hz correspond à ce qu'on entend. Une noire à 120 BPM = 2 Hz
- [ ] SYNC actif, le curseur VITESSE est grisé
- [ ] **le LFO s'applique aux quinze moteurs**, pas seulement à ceux qui ont
      déjà leur LFO interne — il est inséré entre le gain et l'enveloppe, là où
      tous passent
- [ ] **un échantillon fabriqué porte la modulation**


### Le rack d'effets — saturation et chorus
Panneau EFFETS du rack, à côté du delay et de l'égaliseur.

- [ ] la saturation s'entend, et les deux modes diffèrent : **DOUX** écrête
      progressivement, **REPLI** replie le signal — beaucoup plus agressif
- [ ] mélange à 0 % : le son est **strictement** celui d'avant. La voie directe
      passe toujours
- [ ] **les trois modes de modulation sonnent différemment.** CHORUS épaissit
      sans désaccorder ; FLANGER fait un souffle métallique qui balaie ;
      PHASER creuse des trous mouvants. S'ils se ressemblent, c'est le délai
      central qui n'a pas changé — c'est toute la différence entre chorus et
      flanger, un ordre de grandeur
- [ ] **le PHASER s'entend.** Un passe-tout ne change pas l'amplitude : c'est
      la somme avec la voie directe qui creuse. Si le phaser laisse le son
      intact, cette voie est coupée
- [ ] le RETOUR du flanger n'apparaît **que** pour le flanger, et à fond il
      siffle sans diverger
- [ ] **le délai à 4 prises ne diverge pas, RETOUR à fond.** C'est l'invariant
      qui compte : seule la première prise réinjecte. Si toutes bouclaient, le
      gain de boucle serait multiplié par quatre et le plafond ne protégerait
      plus rien
- [ ] à 4 prises, le son ne sature pas — les niveaux sont compensés
- [ ] ÉCART à 0 % : on n'entend qu'un seul écho, comme à une prise
- [ ] **profondeur à fond, le chorus ne se tait jamais par intermittence.**
      C'est la borne qui empêche le temps de délai de passer négatif
- [ ] vitesse à fond : c'est encore un chorus, pas un vibrato
- [ ] **un échantillon fabriqué porte saturation et chorus** — même chaîne pour
      le jeu et le rendu, c'est l'invariant


### Superposition de patches
Pastille ronde ○ sur chaque patch : elle l'empile **sur** le patch actif, avec
ses propres réglages et son propre moteur.

- [ ] deux patches superposés s'entendent tous les deux, chacun avec SON timbre
      — pas le même moteur deux fois
- [ ] l'oscilloscope montre **une onde par couche**, de couleurs différentes,
      le patch actif par-dessus
- [ ] quatre patches ne saturent pas — la compensation est en racine du nombre
      de couches, et une saturation s'entend nettement
- [ ] un patch à longue résonance (Rings, Clouds) n'est pas coupé par un patch
      court dans le même empilement
- [ ] **le sample fabriqué sonne comme le direct** : c'est l'invariant qui
      compte, jeu et rendu passent par le même chemin, effets compris

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

### Recherche de patches
- [ ] taper filtre bien les 76 patches d'usine et les patches perso
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
