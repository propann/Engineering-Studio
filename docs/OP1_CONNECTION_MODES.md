# Modes de connexion PC de l'OP-1 original

## Objet

Ce document fixe le comportement attendu d'OP-1 Studio lorsqu'un OP-1
original est relié à un PC par USB. Il distingue le mode visible sur l'OP-1,
les interfaces que le système peut exposer et les opérations que
l'application est autorisée à proposer.

Le câble USB mini-B de l'OP-1 original sert à l'alimentation, à l'audio, aux
transferts de fichiers et au MIDI. Une connexion USB physique ne constitue
donc pas, à elle seule, une preuve de mode ni une autorisation d'écriture.

## Matrice des modes

| Mode OP-1 | Sélection sur l'OP-1 | Preuves PC attendues | Autorisations OP-1 Studio |
| --- | --- | --- | --- |
| Fonctionnement normal | `COM` puis `T1` / `OP-1` | Périphérique USB, interfaces MIDI et audio éventuellement visibles | État, audio et MIDI ; aucun accès aux fichiers |
| Contrôleur MIDI | `COM` puis `T2` / `CTRL` | Interfaces MIDI visibles ; pas de volume utilisateur attendu | MIDI entrant/sortant ; aucun accès aux fichiers |
| Disk | `COM` puis `T3` / `DISK` | Volume amovible avec structure OP-1 (`tape`, `album`, `synth`, `drum`) | Inventaire et sauvegarde ; écriture uniquement par plan confirmé |
| TE-boot maintenance | OP-1 éteint, `COM` au démarrage, puis fonction choisie | Petit volume de maintenance après la fonction firmware | Parcours firmware officiel guidé ; pas de gestion de samples |
| Charge / absence de données | Câble ou alimentation sans interface exploitable | Alimentation éventuelle, aucune preuve suffisante de l'OP-1 | Aucun accès et aucune écriture |
| Inconnu / transition | Changement de mode, déconnexion ou résultat ambigu | Signaux partiels, volume instable ou identifiants incomplets | Lecture système minimale ; toutes les mutations bloquées |

Les modes normal et contrôleur sont deux usages MIDI du fonctionnement de
l'OP-1. Ils ne doivent pas être confondus avec le mode Disk, qui transforme
l'appareil en stockage. Le mode TE-boot est encore différent : le guide
constructeur le décrit comme le bootloader utilisé pour les mises à jour, les
tests et la réinitialisation.

Dans le Hub, la présence d’un port `OP-1 MIDI` ne suffit pas à distinguer le
mode normal de `CTRL`. Le mode classique laisse le relais contrôleur désactivé.
Pour piloter l’atelier depuis l’OP-1, l’utilisateur choisit `COM → T2 / CTRL`,
actualise les ports, puis active explicitement l’entrée contrôleur. Les notes
entrantes sont alors relayées vers l’EP-133 et les studios ouverts, jamais vers
la sortie OP-1 source, afin d’éviter une boucle MIDI. Ce relais ne donne aucun
accès aux fichiers et ne déclenche aucune écriture matériel.

## Cycle sûr

```text
Déconnecté
    -> Observation USB/audio/MIDI/volumes
    -> Mode identifié avec preuves suffisantes
    -> Lecture et inventaire
    -> Plan local
    -> Confirmation explicite
    -> Revalidation de l'identité
    -> Copie vérifiée
    -> Synchronisation et éjection
    -> Volume disparu
    -> Retour au mode normal et nouvelle observation
```

Une déconnexion, un changement de volume, une disparition puis réapparition
ou une modification de la structure fait revenir la session à `Inconnu`.
L'application ne rattache jamais automatiquement une nouvelle lettre de
lecteur à une opération déjà approuvée.

## Règles d'implémentation

1. L'identification combine les signaux disponibles : classe USB, VID/PID,
   point de montage, structure du volume, interfaces audio/MIDI et stabilité
   de l'observation. Le VID/PID seul n'est jamais suffisant.
2. Les adaptateurs exposent une observation immuable, par exemple
   `DeviceObservation`, puis le domaine déduit `DeviceMode` et les droits.
3. Un volume utilisateur reconnu en mode normal est une anomalie à signaler,
   pas une permission d'écriture.
4. Un volume TE-boot n'est jamais traité comme un volume Disk générique.
   Le parcours firmware exige une version officielle, une sauvegarde vérifiée,
   une confirmation du mode et une copie manuelle suivie d'une éjection.
5. Les opérations Disk écrivent uniquement dans les racines autorisées du
   plan. Elles vérifient à nouveau l'identité du volume et l'état du fichier
   juste avant chaque mutation.
6. L'éjection est une étape métier. Une éjection refusée ou impossible laisse
   l'opération en état récupérable et l'application ne conseille pas de
   débrancher brutalement.

## État de validation

Validé sur la machine de test le 12 août 2026 :

- mode Disk sur `E:` avec inventaire, sauvegarde, restauration et hashes ;
- mode normal sous Windows avec `VID_2367&PID_0004` ;
- sortie audio `Haut-parleurs (OP-1)` ;
- ports MIDI `OP-1 [2]` et `OP-1 [3]`.

À tester avec l'OP-1 connecté : éjection native, retour Disk vers normal,
capture MIDI/audio interactive, déconnexion pendant copie et parcours
TE-boot. Ces essais restent hors ligne et ne doivent pas activer de service
commercial.

## Sources constructeur

- [Hardware overview OP-1 original](https://teenage.engineering/guides/op-1/original/hardware-overview)
- [Song rendering and connectivity](https://teenage.engineering/guides/op-1/original/song-rendering-and-connectivity)
- [Guide TE-boot OP-1 original](https://teenage.engineering/guides/op-1/original/te-boot)
- [Téléchargements et mises à jour OP-1 original](https://teenage.engineering/downloads/op-1/original)
