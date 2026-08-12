# Périmètre de l’application OP‑1 Studio

OP‑1 Studio devient une application desktop locale installable. Le web actuel est une façade de présentation et de test ; il ne doit jamais être considéré comme le composant qui écrit sur l’OP‑1.

## Les cinq espaces de la première application

| Espace | Rôle | Niveau de risque |
|---|---|---:|
| Firmware | Catalogue officiel, inspection, TE‑boot guidé et journal | Très élevé |
| Sauvegardes | Copie complète, manifestes, comparaison et restauration | Élevé |
| Machine | Explorateur, préparation du remplissage et éjection | Élevé |
| Sons & patches | Samples, kits, éditeur simple et transfert | Moyen |
| Tape & Album | Aperçu non destructif, export et archivage | Moyen |

## Règle de fonctionnement

Toutes les opérations qui modifient la machine utilisent le même moteur :

```text
observer → sauvegarder → préparer un ChangePlan → relire → exécuter → synchroniser → vérifier → éjecter
```

Le moteur distingue trois types de contenu :

- **sample brut** : fichier audio mesuré et converti vers la cible choisie ;
- **patch** : preset synthé ou kit batterie édité dans une copie locale ;
- **morceau** : fichiers de Tape et métadonnées archivés avec le snapshot source.

## Éditeur de patch MVP

La première version de l’éditeur reste volontairement simple : nom, catégorie, aperçu, paramètres exposés par le format, écoute et export d’une copie. Elle ne promet pas de réécrire toutes les bases internes de l’OP‑1 ni de transformer un patch propriétaire en projet DAW.

Un patch modifié est toujours traité comme un nouveau fichier. L’application montre sa destination, vérifie le format, associe une sauvegarde récente et demande une confirmation séparée avant transfert.

## Ce qui est installé dans l’application

- aucune archive de firmware propriétaire ;
- aucun compte nécessaire pour la machine ;
- aucun envoi automatique de samples, patches ou sauvegardes ;
- aucun formatage ou reset usine ;
- aucun mélange entre firmware officiel et labo de modification.

## Ordre de développement

1. détecter et identifier le volume sans écriture ;
2. produire une sauvegarde complète vérifiée ;
3. brancher le catalogue firmware et l’assistant TE‑boot ;
4. préparer le remplissage de la machine avec aperçu des changements ;
5. ajouter l’éditeur de patch et les conversions audio ;
6. seulement ensuite ouvrir Tape, Album et les extensions distantes.
