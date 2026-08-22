# Référence de fonctionnement OP-1

Cette note documente les comportements OP-1 utilisés comme référence pour le clone tactile d'Engineering Studio.

## Source

Référence fournie pour le projet : `op-1-manual-v2-2-479248.htm` (guide utilisateur OP-1, v2.2).

Le manuel sert de référence fonctionnelle et ergonomique. L'interface du projet reste une adaptation tactile avec davantage d'espace d'affichage ; elle ne prétend pas reproduire les dimensions physiques de l'appareil.

## Principes retenus

- Le mode Tape affiche quatre pistes audio, un transport lecture/enregistrement et une tête de lecture.
- Le mode Synth permet de sélectionner un moteur audio puis un son/patch.
- Les moteurs et les patches sont deux sélections distinctes : le moteur définit la technologie de synthèse, le patch définit le réglage sonore chargé.
- Le clavier joue immédiatement le son actif.
- Le MIDI suit le moteur actif et doit rester séparé du transport audio de la bande.
- Les encodeurs couleur du matériel donnent un repère visuel pour les commandes : bleu, vert, blanc et orange. Dans le clone tactile, ce repère est conservé par les couleurs et par des commandes directement manipulables.

## Adaptation dans le clone tactile

Quand le bouton **MENU SON** est activé dans OP-1 Studio :

- le dessin de la cassette reste visible mais est réduit sur la gauche ;
- les commandes **LECTURE/PAUSE** et **ENREGISTRER** restent accessibles dans la barre de contrôle ;
- un petit écran interne présente les **MOTEURS** à gauche en bleu ;
- les **PATCHES** sont présentés à droite en vert ;
- la sélection du moteur est reliée à l'état du moteur audio OP-1 ;
- la sélection du patch est conservée dans les données du projet.

Le bouton **RETOUR K7** revient à l'affichage Tape complet.

## Fonctionnement effectivement livré dans le clone

- Les quatre boutons **PISTE 1–4** sont regroupés dans la bande de transport supérieure ; ils pilotent la piste active.
- Le bouton **REC** enregistre sur la piste sélectionnée et affiche son numéro.
- La bibliothèque **Samples sauvegardés** permet de préécouter un fichier local puis de le charger sur la piste active.
- Le projet et les sources audio sont autosauvegardés dans la même origine : métadonnées en `localStorage`, blobs audio en `IndexedDB`.
- L’actualisation restaure les pistes et les sources lorsque le navigateur conserve le stockage local.
- La bande de commandes située au-dessus du clavier est masquée pour garder le châssis proche de la machine de référence.

## Limites de portée

Cette note ne remplace pas le manuel constructeur. Elle décrit uniquement les comportements nécessaires au clone du projet. Les protocoles OP-1 et EP-133, leurs formats de fichiers et leurs systèmes de transfert restent traités séparément.


## Configuration de l'interface

Le clone possède une tirette **ÉCRAN** pour réduire ou agrandir l'affichage. La valeur peut descendre jusqu'à 50 %, ce qui permet de rapprocher la taille de l'écran de celle du clavier virtuel.

La barre **CONFIG** du châssis permet d'associer les commandes virtuelles aux commandes MIDI de la machine. Ces associations sont conservées localement sur le disque du client via le stockage navigateur ; les réglages de vue, le moteur et le patch actifs sont également inclus dans la fiche projet exportée `.op1studio.json`.


## Clavier MIDI virtuel et configuration locale

- Le bouton **LECTURE/PAUSE** est visible directement sous le clavier MIDI virtuel et réutilise le transport du studio.
- La configuration des associations MIDI est enregistrée localement dans une enveloppe versionnée (op1-studio-control-config, version 1).
- **Figer la configuration** désactive l'apprentissage et les modifications accidentelles ; le déverrouillage demande une action explicite.
- La fenêtre de configuration affiche seulement les trois derniers messages du journal MIDI. Le tampon complet reste téléchargeable pour le diagnostic.
