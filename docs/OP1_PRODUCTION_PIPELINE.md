# Chaîne de fabrication OP-1

## Objectif

Une création produite dans OP-1 Studio doit pouvoir devenir un fichier AIFF validé, un patch marqué OP-1 ou un pack Tape/Album. La fabrication et le transfert sont deux étapes différentes.

## Étapes obligatoires

1. Le moteur audio produit un rendu local.
2. Le convertisseur impose le format de la cible :
   - OP-1 : AIFF PCM 16 bits, 44,1 kHz ;
   - samples synthé : mono, maximum 6 secondes ;
   - samples drum : mono, maximum 12 secondes ;
   - Tape : quatre fichiers `track_1.aif` à `track_4.aif`, avec une durée de bande maximale de 360 secondes.
3. Les positions de clips sont rendues dans les stems. Une position à 30 secondes ne doit pas redevenir une position à zéro dans le fichier exporté.
4. Un patch OP-1 reçoit son chunk `APPL/op-1`. Un AIFF audio sans ce chunk est un fichier audio, pas un patch complet.
5. Le validateur inspecte les conteneurs, le débit, les canaux, la durée, les chemins et les métadonnées.
6. Le manifeste du pack est généré avec `machineWrite: false`.
7. La copie vers une machine reste bloquée tant qu'une étape native dédiée et une confirmation explicite ne sont pas ajoutées.

## Séparation des machines

L'OP-1 et l'EP-133 n'utilisent pas le même contrat. Le flux OP-1 reste AIFF / disque USB ; le flux EP-133 reste WAV / protocole propre à l'EP-133. Une conversion destinée à l'une ne doit pas être réutilisée automatiquement pour l'autre.

## Fonctionnement livré dans le studio

- Les samples sauvegardés sont préécoutables et chargeables localement sur la piste sélectionnée.
- Les projets OP‑1 sont autosauvegardés dans la même origine ; cette persistance navigateur ne remplace pas un export `.op1studio.json` ni une sauvegarde de dossier.
- Le chargement d’un sample dans le studio ne déclenche aucun transfert vers l’OP‑1.
- Le pipeline reste strictement séparé de l’EP‑133 : même niveau de sécurité, formats et protocoles différents.

## Limites actuelles

La validation logicielle garantit la structure et les contraintes connues, mais elle ne remplace pas une relecture sur un OP-1 physique. Le transfert natif devra être développé et testé séparément, avec une protection contre l'écrasement et un mode simulation par défaut.
