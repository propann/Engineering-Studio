# Modèle de spécification d'écran UI

Dupliquer ce document pour toute nouvelle page ou refonte majeure.

## Identité

- Nom de l'écran :
- Route / entrée :
- Machine : Hub / OP-1 / EP-133 / partagé
- Responsable :
- Ticket roadmap :

## Tâche utilisateur

Décrire une seule tâche principale en une phrase commençant par un verbe.

## Données et risques

- Données lues :
- Données écrites :
- Données supprimables :
- Permission navigateur :
- Machine physique :
- Risque principal :

## Hiérarchie

1. état global ;
2. action principale ;
3. contenu de travail ;
4. actions secondaires ;
5. aide et réglages avancés.

## États

- [ ] vide ;
- [ ] permission requise ;
- [ ] déconnecté ;
- [ ] chargement ;
- [ ] prêt ;
- [ ] succès ;
- [ ] erreur récupérable ;
- [ ] erreur bloquante ;
- [ ] danger / confirmation ;
- [ ] disabled.

## Composants réutilisés

- `AppShell` :
- `Button` :
- `Card` :
- `StatusBadge` :
- `Tabs` :
- `EmptyState` :
- `ConfirmDialog` :
- composants métier :

## Responsive

| Largeur | Organisation | Navigation | Action principale |
| --- | --- | --- | --- |
| 1600 |  |  |  |
| 1280 |  |  |  |
| 768 |  |  |  |
| 360 |  |  |  |

## Accessibilité

- Nom accessible de l'écran :
- Ordre clavier :
- Raccourcis :
- Live regions :
- Gestion du focus :
- Réduction des animations :

## Thèmes

- Atelier :
- Studio :
- Accent machine :
- Contrastes particuliers :

## Critères d'acceptation

- [ ] fonction réelle branchée ;
- [ ] aucun faux état ;
- [ ] deux thèmes ;
- [ ] quatre largeurs ;
- [ ] clavier et focus ;
- [ ] états pertinents ;
- [ ] tests ;
- [ ] typecheck ;
- [ ] build ;
- [ ] contrôle visuel ;
- [ ] documentation mise à jour.

## Hors périmètre

Lister explicitement ce qui ne doit pas être modifié dans ce ticket.
