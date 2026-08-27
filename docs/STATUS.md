# État actuel — Engineering Studio

Date de référence : **2026-08-27**

## Synthèse

Le Hub est déployé sur Coolify en HTTPS, et le rack est passé d'un instrument
qu'on écoute à un outil qui **produit des fichiers** : samples encodés au format
de la machine visée, écrits et relus pour vérification.

Sept vérifications matérielles ont été faites, avec date et observation, dans
[TESTS_PHYSIQUES.md](TESTS_PHYSIQUES.md) — c'est le document qui dit ce que les
les tests automatiques ne peuvent pas prouver.

## Tableau de vérité

| Domaine | État |
|---|---|
| Dépôt GitHub | Opérationnel, branche `main` |
| Intégration continue | ✅ tourne sur `main`, la branche réellement déployée |
| Déploiement Coolify | Opérationnel, HTTPS via le proxy |
| Tests automatisés | ✅ CI verte sur les six travaux ; contrôles natifs OP-1 et EP-133 séparés |
| Profil local | ✅ récupérable depuis le dossier de travail |
| Dossier de travail | ✅ mémorisé, permission vérifiée au rechargement |
| Coffre — sauvegarde | ✅ validée à l'usage, dossiers vides compris |
| Coffre — restauration | 🔶 mécanisme validé sur l'OP-1, orchestration non |
| Écriture sur l'OP-1 | ✅ vérifiée octet par octet, machine rendue intacte |
| Web MIDI | ✅ instantané à l'usage sur l'OP-1 |
| Rack — synthèse | ✅ 15 moteurs, 76 patches, superposition par patch |
| Rack — fabrication de samples | ✅ note seule et pack chromatique, son validé |
| Rack — effets | ✅ quatre familles : saturation (doux, dur, repliement), égaliseur (courbe tracée, 5 prédéfinies), modulation (chorus/flanger/phaser), delay 1 à 8 prises avec panoramique |
| Rack dans les studios | ✅ EP‑133 et OP‑1 |
| Rack MIDI (arpégiateur, 30 gammes, séquenceur pas à pas) | ✅ longueur de note réglable et enregistrement pas à pas |
| Enveloppe ADSR et LFO global | ✅ courbe tracée, 5 enveloppes prédéfinies, rampes exponentielles ou droites ; LFO avec déphasage à l'origine, appliqué aux quinze moteurs |
| Chaque rack porte son interface | ✅ verrouillé par test |
| Rack principal : une source unique | ✅ un seul tableau d'outils, plus de cartes écrites à la main |
| MIDI partagé entre composants | ✅ répartiteur, cinq consommateurs migrés |
| EP-133 par SysEx | ⬜ aucun mode disque, tout passe par là |
| OP-1 Studio — clone tactile | ✅ quatre pistes, transport, REC piste active, écran/racks, clavier MIDI et couleurs machine | 
| OP-1 Studio — samples sauvegardés | ✅ préécoute et chargement sur la piste active depuis la bibliothèque locale | 
| OP-1 Studio — persistance après actualisation | ✅ métadonnées `localStorage` + blobs audio `IndexedDB` | 
| Registre des pages | ✅ les 20 routes recensées avec leur provenance, leur source et leurs portes ; filtres visibles à toutes les largeurs |
| Sauvegarde des patches | ✅ archive ZIP de tout le travail personnel, relue fichier par fichier |
| Thème clair / sombre | 🔶 socle, jetons et sept composants communs livrés ; la migration des pages reste à faire — `styles.css` compte encore 306 couleurs distinctes en dur |

**Ce qu'il ne faut pas déclarer validé** : la restauration *par l'application*
vers une machine. Le mécanisme d'écriture l'est — écrire, démonter, relire,
comparer les empreintes — mais pas son orchestration.

**Contrat machine :** la CI partage le niveau de sécurité, pas le protocole matériel. Les contrôles OP-1 couvrent ses AIFF, patches, volume et MIDI ; les contrôles EP-133 couvrent ses projets, samples et échanges MIDI/SysEx. Un test de l'un ne constitue jamais une preuve pour l'autre.

## Derniers travaux

### 25 et 26 août 2026

- Égaliseur : courbe de réponse tracée, calculée sur la même table de bandes que
  le graphe audio — deux tables divergeraient sans que rien ne le signale. Cinq
  courbes prédéfinies, PLAT en tête pour que l'essai ne soit pas à sens unique.
- Saturation : écrêtage franc ajouté aux modes doux et repliement.
- Enveloppe : courbe tracée sur les mêmes rampes exponentielles que le moteur
  joue, cinq enveloppes prédéfinies, et le choix rampes courbes ou droites,
  appliqué aux cinq endroits du rack par un point unique.
- Délai : de quatre à huit prises, toutes distinctes — l'écart se met à
  l'échelle du plafond au lieu de les empiler dessus. Panoramique en renvoi de
  balle, non construit en mono pour que le fichier exporté garde l'équilibre du
  jeu.
- LFO : déphasage à l'origine, par rotation de chaque harmonique de k·φ.
- Patches : archive ZIP de tout le travail personnel, un fichier JSON par patch
  pour qu'un patch corrompu n'emporte pas les autres.
- Arpégiateur et séquenceur : longueur de note réglable, et enregistrement pas
  à pas de ce qu'on joue.
- Écran des exercices OP-1 : colonnes alignées sur les touches — l'écart était
  une différence d'échelle, nul au centre et de 8,7 px aux extrêmes.
- Registre des pages : les routes recensées avec leur provenance, leur fichier
  source et leurs portes d'entrée, vérifiées contre le code.
- Studio EP-133 : le jeu redevient accessible depuis le Hub, deux cartes
  menaient au même écran.
- Documentation : garde-fou contre les liens morts sur les 157 documents
  vivants ; les 39 liens morts sont tous dans les archives, et c'est assumé.

### 27 août 2026

- Sélecteurs d'élément nus : `nav` et `footer`, hérités de la maquette, frappaient
  des composants écrits bien après eux. `footer { background:#111; min-height:120px }`
  imposait un bloc noir sous chaque visuel machine de l'accueil ; `nav { display:none }`
  masquait la barre de filtres du registre entre 761 et 900 px. Les deux règles
  sont nommées, leurs cibles d'origine n'existant plus, et un test interdit le
  retour d'un sélecteur nu.
- Accueil : la page tient dans une fenêtre de 1440 × 900 sans défilement, contre
  1 042 px auparavant. Alerte compacte et centrée, texte inchangé.
- Visuels machine : l'image débordait sa boîte et l'EP-133 se faisait rogner.
  Photo recadrée sur la machine, fond mort retiré.
- Déploiement : le build porte son commit et sa date dans le `<head>`, et
  `npm run deploiement` compare la production à `origin/main`. Le décalage
  n'était jusque-là constatable qu'en comparant des empreintes de feuilles CSS.

### 26 août 2026

- Rhythm Hero retirée : page de texte annonçant un entraînement, alors que le
  vrai jeu EP-133 est accessible depuis le Hub. Les clés `ep133-rhythm-hero:*`
  de l'app EP-133 sont conservées — c'est l'ancien nom du dépôt, pas la page.
- Feuilles de route alignées : `docs/ROADMAP.md` devient la principale, son
  journal de phases part en archive, et les huit autres portent un renvoi.

### Jusqu'au 22 août 2026


- Configuration Coolify/Nixpacks alignée sur Bun.
- Domaine de production autorisé dans Vite preview.
- Health check documenté : HTTP interne sur le port 3000.
- Valeurs personnelles retirées des nouveaux profils.
- Exemples audio personnels renommés en exemples de démonstration.
- Documentation principale rangée dans docs/INDEX.md.
- Module profil partagé ajouté dans apps/studio-hub/src/core/profile.ts.
- Clone OP‑1 aligné sur l’interface demandée : contrôles Piste 1–4 dans la bande supérieure, bande haute du clavier retirée, écran/racks tactiles et mode machine visible.
- Autosauvegarde du projet OP‑1 ajoutée : réglages, pistes, références et sources audio sont restaurés après actualisation dans la même origine.
- Bibliothèque « Samples sauvegardés » ajoutée : préécoute puis chargement local sur la piste sélectionnée, sans écriture machine.

## Ce qui est fiable

- Le dépôt canonique est propann/Engineering-Studio.
- main est la branche de référence.
- Le service public est engineering-studio.duckdns.org.
- Le stockage de profil actuel est local au navigateur.
- Le serveur ne reçoit pas le profil local dans cette version.

## Prochaines étapes recommandées

1. **Uniformiser l'interface.** Le socle, les jetons et sept composants communs
   sont livrés ; les pages restent en couleurs codées en dur — `styles.css` en
   compte 306 distinctes. Voir [l'audit visuel](audits/AUDIT_VISUEL_2026-08-26.md) et le
   [système de design](design/DESIGN_SYSTEM.md).
2. **Couvrir les deux studios.** `apps/op1-studio` fait 39 091 lignes pour huit
   fichiers de test, `apps/ep133-studio` 8 474 pour trois. C'est le déséquilibre
   le plus net du dépôt.
3. Trancher la route `sound-editor-hub` : le composant est déjà monté dans la
   Bibliothèque sonore, et sa route directe s'ouvre sans barre de navigation —
   « Voir la page » depuis le registre y enferme l'utilisateur.
4. Trancher le rattachement au Hub des trois pages récupérables constatées dans
   [le rapport des doublons](RAPPORT_DOUBLONS_PAGES_2026-08-26.md).
5. Ajouter des tests de démarrage avec localStorage vide et IndexedDB vide.
6. Tester manuellement une nouvelle fenêtre privée sur le domaine HTTPS et
   vérifier la restauration d’un projet audio.
7. Ajouter un scénario navigateur de remplacement et suppression d’une source
   persistée.
8. Brancher les pages restantes sur le module profil partagé.
9. Conserver les installations des studios synchronisées avec leurs manifests.
10. Auditer les états locaux indépendants des modules.
11. Préparer un routage URL stable avant de rendre les pages partageables.

## Règle de communication

Ne pas utiliser « Production Ready » pour l’ensemble du produit tant que les
tests automatisés, les parcours navigateur et la validation matérielle ne sont
pas documentés. Dire plutôt : « Hub local fonctionnel, intégration matérielle
en cours ».


### Dernier alignement OP-1 Studio

- Clavier MIDI virtuel : bouton LECTURE/PAUSE visible et relié au transport existant.
- Configuration MIDI locale : enveloppe versionnée, sauvegardée côté client, avec verrouillage explicite après validation.
- Journal MIDI : affichage limité aux 3 messages les plus récents ; le tampon diagnostic reste téléchargeable.
