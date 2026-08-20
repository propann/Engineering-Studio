# Nouvel arrivant et données locales

## Comportement attendu

À la première ouverture, ou dans une fenêtre privée :

- aucun nom personnel n’est affiché ;
- aucune bio personnelle n’est affichée ;
- aucune machine personnelle n’est préconfigurée dans la fiche ;
- aucun disque ou chemin personnel n’est présenté comme monté ;
- le profil indique NOUVEAU MEMBRE jusqu’à la création d’une fiche ;
- la landing présente le produit, pas les données d’un autre utilisateur.

## Stockage actuel

La fiche est enregistrée sous :

~~~text
localStorage[\"studio-hub-profile\"]
~~~

Le serveur Coolify ne fournit actuellement aucune donnée de profil. Les
profils ne traversent donc pas les navigateurs et ne sont pas partagés entre
visiteurs.

## Test manuel de confidentialité

Dans Chrome :

1. Ouvrir une fenêtre privée.
2. Charger https://engineering-studio.duckdns.org.
3. Ouvrir Mon Profil.
4. Vérifier que le nom et la bio sont vides.
5. Vérifier que machines et disques sont à ajouter manuellement.
6. Créer un profil de test et recharger la page.
7. Fermer la fenêtre privée et recommencer dans une nouvelle fenêtre privée.

Le profil du test ne doit pas apparaître dans la seconde session.

## Limite à ne pas oublier

Cette protection est locale à une origine et à un profil navigateur. Elle ne
constitue pas une authentification. Si Engineering Studio devient un service
multi-utilisateur, il faudra ajouter une identité serveur, des sessions, une
base de données et une politique d’accès avant de stocker des profils côté
serveur.

