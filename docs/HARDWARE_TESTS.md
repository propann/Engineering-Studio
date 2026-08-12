# Validation materielle OP-1

Derniere validation : 12 aout 2026, OP-1 original en mode Disk sur `E:`.

## Mode Disk valide

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

## Tests restants

Ces tests ne sont pas declares valides par cette session :

- ejection native automatique ;
- transfert d'un pack complet prepare par l'application ;
- reprise apres deconnexion pendant une copie ;
- capture MIDI et audio USB interactifs ;
- mode TE-boot et flux firmware.

Le mode suivant est le mode normal/MIDI. Il doit etre lance apres ejection
Windows du volume Disk, puis retour de l'OP-1 en fonctionnement normal.

## Mode normal detecte

Le 12 aout 2026, Windows a expose l'OP-1 en fonctionnement normal avec :

- un peripherique media USB `OP-1` ;
- une sortie audio `Haut-parleurs (OP-1)` ;
- deux interfaces MIDI `OP-1 [2]` et `OP-1 [3]`.

Cette detection systeme est validee. La capture d'une note et l'envoi d'un
message MIDI doivent encore etre verifies depuis Chrome ou Edge avec Web MIDI.
