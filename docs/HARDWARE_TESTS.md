# Validation materielle OP-1

Derniere validation : 14 aout 2026, OP-1 original en mode Disk sur `E:`.

## Mode Disk valide (12 aout 2026)

| Test | Resultat |
| --- | --- |
| Detection USB et volume FAT | OK |
| Identification par `tape`, `album`, `synth`, `drum` | OK |
| Inventaire complet | 67 fichiers, 282529116 octets |
| Sauvegarde locale avec manifeste | OK |
| Verification SHA-256 du snapshot | OK |
| Comparaison de deux snapshots | 11 differences detectees et listees |
| Suppression controlee d'un preset utilisateur | OK, `synth/user/8.aif` |
| Verification de disparition | OK |
| Restauration depuis le snapshot | OK |
| Verification SHA-256 apres restauration | OK |
| Nettoyage des fichiers temporaires | OK, aucun `.partial` |
| Build et tests applicatifs pendant la session | OK |

Le preset restaure fait 88778 octets et son SHA-256 est :
`7D513FD40F49BEB7FD8D83EDE5008357AE24E1232CB49C5B513D2785B846D714`.

## Session du 14 aout 2026 — re-verification et nouveau test

Machine reconnectee, mode Disk sur `E:` a nouveau confirme identique a la
session du 12 aout (memes dossiers `tape`/`album`/`synth`/`drum`).

| Test | Resultat |
| --- | --- |
| Nouveau backup complet (`tools/backup_manifest.py create`) | **OK** — 67 fichiers, 282528926 octets (~269 Mo), tous verifies SHA-256, deviceFingerprint `bd41a95e...`, snapshot `op1_20260814T122321Z_046bd31e` dans `Music\OP-1\backups\` (hors depot, dossier de travail reel de l'utilisateur) |
| Coherence avec la session du 12 aout | **OK** — meme nombre de fichiers, meme taille totale (282529116 vs 282528926 octets, ecart de 190 o expliquable par `System Volume Information` qui change legerement d'une session a l'autre) — confirme que le contenu utilisateur de la machine n'a pas change entre les deux sessions |
| Conversion AIFF reelle (`app/lib/audioConvert.ts`, `convertToOp1Audio`) sur un sample reel (`cluster_pad_fix.wav`, 58 940 o) | **OK cote code** — mono 44,1 kHz/16 bits, 1,31 s, 115 638 o produits, relu et valide par `parseAiffFormat` (le meme oracle que le reste de l'app) avant toute copie. Fichier depose dans `synth/user/optest01.aif` sur la machine reelle. |
| **Lecture reelle de `optest01.aif` sur la machine** | **en attente du retour utilisateur** — copie faite, ejection et test de lecture encore a faire cote utilisateur au moment de la redaction |
| Anomalie mineure notee, pas bloquante | `analyzeWavBuffer` (app/lib/audioOracle.ts) a renvoye "non reconnu" sur `cluster_pad_fix.wav` alors que `convertToOp1Audio` (qui utilise `parseWavFormat` en interne) a lu le meme fichier sans probleme — les deux chemins de lecture WAV divergent sur au moins un fichier reel, a investiguer (pas urgent, la conversion elle-meme a fonctionne) |

## Ce qui reste a tester en reel (liste vivante, 14 aout 2026)

Priorise par ce qui verifierait le plus de travail de cette session avec le
moins d'ambiguite :

1. **Lecture de `optest01.aif`** (deja copie, voir ci-dessus) — la
   verification la plus proche d'etre terminee, juste l'ejection/test manuel
   qui manque.
2. **Export Stems/Album en AIFF mono** (`audioBufferToAiffMono`,
   `app/page.tsx`, corrige le 14 aout 2026 — etait en WAV stereo avant) :
   exporter depuis le Studio, copier `track_1.aif` dans `tape/`, verifier
   que la piste se lit correctement sur la machine. Ne peut pas etre teste
   hors navigateur comme `optest01.aif` (depend d'`AudioContext`/
   `decodeAudioData`), a faire depuis l'app reelle.
3. **Patch drum avec marqueurs `start`/`end`** : `AUDIO_FILE_FORMAT_REFERENCE.md`
   §2.5 documente une echelle interne fixe de 12 s pour `start`/`end`, jamais
   verifiee sur materiel — ecrire un patch drum avec des marqueurs connus
   (via `op-patch-util`/`tools/patch_bridge.py`) et observer ou la machine
   coupe reellement le son.
4. **`applyFade`/fondu de `audioConvert.ts`** : verifier a l'oreille qu'un
   fondu d'entree/sortie prepare via "Preparer le fichier" (Sons) sonne
   comme attendu une fois joue sur la machine, pas seulement correct en
   theorie cote calcul.
5. **Ejection native automatique** depuis l'app (pas encore de bouton dedie,
   toujours une ejection manuelle Windows) et **reprise apres deconnexion
   pendant une copie** — jamais testes.
6. **Mode TE-boot et flux firmware complet** — jamais teste de bout en
   bout, le parcours reste uniquement documente (`FIRMWARE_SAFETY.md`,
   `FIRMWARE_LAB.md`).
7. **Capture MIDI et audio USB interactifs** en mode normal — deja detectes
   au niveau systeme (`VID_2367&PID_0004`, `Haut-parleurs (OP-1)`, ports
   `OP-1 [2]`/`OP-1 [3]`), jamais verifie que Web MIDI capture reellement
   une note jouee physiquement sur la machine (aucun navigateur
   automatisable pour ce test precis).
8. **Anomalie `analyzeWavBuffer` vs `parseWavFormat`** notee ci-dessus — pas
   un test materiel a proprement parler, mais decouverte pendant cette
   session de tests, a investiguer avec des fixtures avant la prochaine
   session materielle.

## Detection MIDI/audio du 12 aout 2026

La machine a ete rebranchee en mode normal pendant le test de
`http://127.0.0.1:4173/`. Windows expose `USB\\VID_2367&PID_0004`, la sortie
audio `Haut-parleurs (OP-1)` et les ports MIDI `OP-1 [2]` et `OP-1 [3]`.
Le serveur local repond `HTTP 200`.

L'ouverture de Studio lance maintenant une tentative de détection silencieuse ;
le bouton MIDI reste une relance manuelle. L'autorisation Web MIDI et la
capture note-on/note-off restent à vérifier dans Chrome ou Edge : aucun
navigateur automatisable n'est disponible dans cet environnement.

## Mode normal detecte

Le 12 aout 2026, Windows a expose l'OP-1 en fonctionnement normal avec :

- un peripherique media USB `OP-1` ;
- une sortie audio `Haut-parleurs (OP-1)` ;
- deux interfaces MIDI `OP-1 [2]` et `OP-1 [3]`.

Cette detection systeme est validee. La capture d'une note et l'envoi d'un
message MIDI doivent encore etre verifies depuis Chrome ou Edge avec Web MIDI.
L'application ecoute les deux ports d'entree `OP-1 [2]` et `OP-1 [3]` et
decode les messages note-on/note-off sur tous les canaux MIDI. Le mode
`CONFIG` du clone utilise cette ecoute pour afficher la touche jouee, meme
hors capture ; le mode `MIDI externe` est necessaire pour envoyer les notes
du clavier virtuel vers la machine.

Pour le test matériel de contrôle : depuis `COM`, sélectionner `CTRL` avec
`T2`. L'OP-1 devient alors un contrôleur MIDI avec son clavier, ses quatre
encodeurs et son transport. Le canal d'émission se change avec `Shift` et
l'encodeur vert ; l'application ne filtre volontairement aucun canal à la
réception. La sélection `Mode contrôle` dans Studio active la connexion Web
MIDI côté application, mais ne change pas le mode de l'OP-1 à distance.
