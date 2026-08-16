# Synchroniser l’OP‑1 et l’EP‑133

## L’idée en une phrase

Le Hub joue le rôle de métronome commun. Il envoie aux deux machines le même
tempo, le même démarrage et le même arrêt, et relaie aussi ce transport aux
fenêtres OP‑1 et EP‑133 ouvertes depuis le Hub. Les studios restent
responsables des sons, des séquences et des sauvegardes.

Dans le Hub :

1. branche l’OP‑1 et l’EP‑133 en USB sur le même ordinateur ;
2. ouvre **Synchronisation MIDI** ;
3. clique sur **Connecter les machines** et vérifie que les deux sorties sont
   affichées ;
4. règle le BPM puis clique sur **Démarrer les deux** ;
5. arrête avec **Arrêter** avant de débrancher.

Pour travailler sans machine, ouvre simplement les deux studios depuis le Hub,
puis clique sur **Tester sans machine**. Le Hub envoie alors uniquement le
transport logiciel aux deux fenêtres ; aucune sortie Web MIDI n’est requise.

Le Hub envoie uniquement les messages MIDI realtime `Start`, horloge à
24 impulsions par noire (24 PPQN) et `Stop`. Il n’envoie aucun projet, sample,
SysEx ou firmware.

Quand les deux studios sont ouverts, le Hub diffuse également un événement
`studio-hub.transport.v1` limité aux fenêtres et origines autorisées. Cela
permet de tester le démarrage/arrêt synchronisé sans aucune machine connectée.
Le BPM reçu est appliqué à la lecture de l’éditeur EP‑133 et au tempo affiché
dans Tape OP‑1.

## Routage de test sans machine

Dans le bloc **Routage de test sans machine**, les boutons `C2`, `D2` et `E2`
envoient une note virtuelle courte aux fenêtres OP‑1 et EP‑133 ouvertes depuis
le Hub. Le bouton **PANIC** envoie un message d’arrêt logiciel commun pour
vider les notes éventuellement restées actives. Ces messages sont versionnés,
filtrés par origine et limités aux fenêtres des studios : ils ne sont pas
envoyés aux ports Web MIDI et ne modifient aucune sauvegarde.

## Réglage des machines

Une seule horloge doit être maître. Pour le premier essai, le Hub est le
maître et les deux machines doivent écouter l’horloge externe. Sur l’OP‑1,
le mode `sync` écoute l’horloge MIDI externe ; le mode `beat match` sert au
contraire à envoyer la synchronisation. Sur l’EP‑133, le réglage se trouve
dans `Shift + Erase → MIDI → Clock` ; `On` écoute et `Out` transmet.

Références constructeur : [tempo OP‑1](https://teenage.engineering/guides/op-1/original/tempo),
[réglages MIDI EP‑133](https://teenage.engineering/guides/ep-133/how-to) et
[système EP‑133](https://teenage.engineering/guides/ep-133/system).

## Limites connues

- Le navigateur doit autoriser Web MIDI ; Chrome/Chromium est le chemin
  prévu.
- Le bouton **Tester sans machine** permet de valider le parcours logiciel et
  les fenêtres ouvertes ; il ne produit aucun son matériel.
- Le Hub synchronise le transport matériel et propose un routage de notes de
  test logiciel. Il ne fusionne pas encore les notes internes des deux
  éditeurs et ne remplace pas un routage MIDI avancé.
- Ne lance pas deux fenêtres Hub qui envoient l’horloge en même temps.
- Le premier test doit rester sans transfert de fichiers : vérifier tempo,
  démarrage et arrêt, puis seulement essayer le jeu réel.

## Contrat technique

Le calcul partagé vit dans `packages/midi-bridge/src/index.ts` :
`buildMidiClockWindow()` produit des paquets horodatés et testables sans
machine. La page Hub utilise ensuite l’API Web MIDI pour programmer ces
paquets sur les sorties dont le nom contient `OP‑1` ou `EP‑133`.
