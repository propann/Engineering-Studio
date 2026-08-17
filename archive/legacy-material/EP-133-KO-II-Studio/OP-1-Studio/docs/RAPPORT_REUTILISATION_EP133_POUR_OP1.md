# Rapport pour Claude — Réutilisation du dépôt EP-133 K.O. II dans OP-1 Studio

Date : 13 août 2026

## Objet

Évaluer le dépôt [EP-133-KO-II-Studio](https://github.com/propann/EP-133-KO-II-Studio)
et identifier les éléments techniquement réutilisables dans OP-1 Studio sans
affaiblir l'architecture locale, les garde-fous machine ou les contraintes
spécifiques de l'OP-1 original.

L'étude a été réalisée sur une copie temporaire du dépôt distant, en lecture
seule. Aucun fichier du dépôt EP-133 n'a été modifié.

## Décision générale

Le dépôt EP-133 contient un travail audio de grande valeur, en particulier pour
l'analyse déterministe des WAV, la détection de silence, le trim non destructif
et la conversion contrôlée.

Il ne faut pas fusionner les deux applications ni copier les composants sans
adaptation. Les deux projets ont des modèles matériels différents :

- OP-1 original : stockage Disk, dossiers `synth/user` et `drum/user`, fichiers
  `.aif`, contraintes propres au sampler OP-1 ;
- EP-133 K.O. II : slots sonores, groupes A-D, fichiers et protocoles propres à
  l'EP-133, fréquences de conversion spécifiques à son firmware.

La stratégie recommandée est de récupérer les algorithmes et les contrats
audio génériques, puis de les adapter au domaine OP-1 dans des modules séparés.

## Éléments à récupérer en priorité

### 1. Analyse audio déterministe

Fichier source étudié : `src/core/audio/wavAnalysis.ts`.

Le module lit directement les octets RIFF/WAVE au lieu de dépendre uniquement
de `AudioContext.decodeAudioData()`. Il sait notamment :

- lire la fréquence source réelle ;
- distinguer canaux, profondeur et durée ;
- traiter PCM 8, 16, 24 et 32 bits ;
- traiter le float 32 bits ;
- calculer le niveau crête ;
- détecter l'écrêtage et compter les échantillons concernés ;
- produire des points de forme d'onde déterministes ;
- retourner `null` pour un fichier non supporté au lieu de casser le parcours.

Cette approche est directement utile au gestionnaire de samples OP-1. Elle
évite de déclarer compatible un fichier sur la base d'une information
rééchantillonnée par le navigateur.

Adaptation nécessaire :

- intégrer la logique dans le domaine audio local d'OP-1 Studio ;
- conserver les règles OP-1, pas celles de l'EP-133 ;
- ajouter des tests pour AIFF, car l'OP-1 utilise principalement ce format ;
- distinguer audio simple et preset `.aif` OP-1 contenant des données
  supplémentaires.

### 2. Trim non destructif et détection du silence

Fichier source étudié : `src/components/shared/WaveformTrim.tsx`.

Le composant propose :

- une région de sélection avec début et fin ;
- une forme d'onde interactive ;
- une lecture locale ;
- une suggestion d'auto-trim basée sur un seuil en dBFS ;
- une marge de sécurité avant et après le signal ;
- des fondus d'entrée et de sortie ;
- un aperçu du résultat converti ;
- une conservation de la source intacte.

OP-1 Studio possède déjà une forme d'onde et un trim simplifié. Il est
préférable d'améliorer le composant existant par étapes plutôt que de remplacer
toute l'interface par `WaveSurfer` immédiatement.

Ordre recommandé :

1. porter d'abord `detectSilenceTrim` et les types de sélection ;
2. afficher une suggestion, jamais l'appliquer automatiquement ;
3. conserver les poignées de trim déjà présentes ;
4. ajouter les fondus et l'écoute de la sélection ;
5. ajouter ensuite un composant plus riche si le besoin est confirmé.

### 3. Conversion contrôlée

Fichier source étudié : `src/core/audio/wavConvert.ts`.

Le module EP-133 applique une chaîne saine :

1. lecture des échantillons réels ;
2. découpe de la sélection ;
3. conversion du nombre de canaux ;
4. rééchantillonnage de qualité ;
5. fondu après rééchantillonnage ;
6. encodage PCM 16 bits avec dithering ;
7. production d'un nouveau tampon en mémoire.

Cette architecture est réutilisable pour OP-1, mais les paramètres doivent
être remplacés par ceux validés pour l'OP-1 original :

- sortie `.aif` compatible OP-1 ;
- mono 44,1 kHz / 16 bits pour les samples utilisateur selon le périmètre
  actuel du projet ;
- limite synthé : 6 secondes ;
- limite drum : 12 secondes ;
- aucune écriture implicite sur le volume OP-1 ;
- sortie locale d'abord, transfert seulement via un `ChangePlan` confirmé.

Les cibles EP-133 `26 250`, `32 000` et `46 875 Hz` ne doivent pas être
réutilisées dans OP-1 Studio. Elles sont spécifiques à l'EP-133 et à son
firmware.

### 4. Gestion locale des dossiers

Fichiers étudiés : `src/core/storage/directoryHandleStore.ts` et
`src/core/storage/localFolders.ts`.

Le dépôt EP-133 possède une bonne gestion navigateur :

- sélection d'un dossier local ;
- stockage du `FileSystemDirectoryHandle` dans IndexedDB ;
- vérification silencieuse des permissions ;
- nouvelle demande de permission seulement après geste utilisateur ;
- séparation lecture et écriture ;
- profils et projets lisibles en JSON.

Cette logique peut servir de référence pour un éventuel mode navigateur local,
mais elle n'est pas prioritaire dans OP-1 Studio. La décision actuelle reste
une application Tauri locale avec opérations critiques dans le cœur natif.

## Éléments à ne pas fusionner

Les éléments suivants sont propres à l'EP-133 et doivent rester dans son
domaine :

- slots 1 à 999 ;
- groupes A, B, C et D ;
- pads 12 touches ;
- mapping MIDI EP-133 ;
- protocole SysEx EP-133 ;
- mémoire 64/128 Mo ;
- fichiers `.pak`, `.ppak` ou structures EP-133 ;
- fréquences de conversion EP-133 ;
- scripts de transfert EP-133 ;
- inventaire basé sur `epsysex` ;
- hypothèses liées au firmware 2.5 EP-133.

Une fonction qui marche pour l'EP-133 ne doit pas être déclarée compatible
avec l'OP-1 par simple ressemblance d'interface ou de format audio.

## Comparaison avec l'état actuel d'OP-1 Studio

OP-1 Studio dispose déjà de :

- préflight Python des WAV et AIFF ;
- prise en charge en entrée des formats courants via FFmpeg/FFprobe ;
- classement `synth/user` et `drum/user` ;
- conversion locale vers AIFF mono 44,1 kHz / 16 bits ;
- forme d'onde affichée dans la bibliothèque ;
- lecture locale des fichiers importés ;
- sélection synthé/drum ;
- trim visuel non destructif ;
- statut selon la durée ;
- manifeste local avec hash et métadonnées ;
- 42 tests Python validés avant l'étude, puis validation TypeScript/build après
  les évolutions d'interface.

Le dépôt EP-133 apporte donc surtout une meilleure base pour :

- l'analyse audio déterministe côté navigateur/TypeScript ;
- la détection du silence ;
- les fondus ;
- la conversion appliquée réellement au trim ;
- les tests audio plus fins ;
- l'aperçu du fichier converti.

## Plan d'intégration recommandé

### Phase A — Oracle audio OP-1

Créer un module TypeScript local OP-1, sans dépendance EP-133, qui expose :

- `analyzeWavBuffer` ;
- `computeWaveformPeaks` ;
- `detectSilenceTrim` ;
- `suggestNormalizationGainDb` ;
- les types de rapport audio et de sélection.

Ajouter des tests synthétiques pour les profondeurs WAV, canaux, écrêtage,
silence, durées limites et fichiers invalides.

### Phase B — Conversion OP-1

Créer une conversion dédiée OP-1 qui :

- consomme uniquement un fichier validé ;
- applique trim et fondus ;
- normalise vers la cible OP-1 ;
- produit un fichier de sortie dans un dossier local de préparation ;
- écrit un manifeste avec source, sortie, hash, durée et destination logique ;
- ne touche jamais au fichier original.

### Phase C — Gestionnaire de samples

Ajouter à l'interface :

- auto-trim proposé mais confirmé par l'utilisateur ;
- aperçu de la sélection seulement ;
- contrôle de gain avec alerte d'écrêtage ;
- aperçu du fichier converti ;
- indication claire `SYNTH 6 s` ou `DRUM 12 s` ;
- bouton « préparer le fichier », distinct de « transférer sur l'OP-1 ».

### Phase D — Safe Change Engine

Une fois la sortie locale vérifiée :

- préparer un plan vers `synth/user` ou `drum/user` ;
- vérifier l'identité du volume ;
- exiger une sauvegarde liée ;
- afficher les remplacements ;
- demander une confirmation explicite ;
- copier avec fichier temporaire, hash et récupération ;
- traiter l'éjection comme une étape séparée.

## Règles de sécurité pour Claude

- Ne pas fusionner le dépôt EP-133 dans OP-1 Studio.
- Ne pas remplacer le modèle de données OP-1 par celui de l'EP-133.
- Ne pas reprendre une fréquence ou une limite sans source OP-1.
- Ne pas utiliser `AudioContext` comme preuve unique de la fréquence source.
- Ne pas modifier les fichiers d'origine pendant l'import, le trim ou la
  conversion.
- Ne pas déclencher d'écriture machine depuis un simple bouton de pré-écoute.
- Ne pas brancher un transfert EP-133 sur les racines OP-1.
- Ne pas réactiver le service en ligne, les comptes ou la synchronisation
  distante : cette partie reste gelée.
- Conserver l'attribution MIT si du code est porté ou adapté.
- Écrire des tests avant toute intégration importante.

## Conclusion

Le dépôt EP-133 est une source technique utile, principalement pour le moteur
audio et le trim avancé. Le meilleur gain pour OP-1 Studio est de porter les
algorithmes génériques d'analyse et de conversion, pas l'architecture machine.

La priorité reste le gestionnaire de samples OP-1 : analyser, écouter, trier,
trimler, convertir, vérifier, puis seulement préparer un transfert contrôlé.
Le prochain chantier recommandé est donc l'intégration de l'analyse WAV
déterministe et de l'auto-trim dans le gestionnaire actuel, avec tests dédiés.
