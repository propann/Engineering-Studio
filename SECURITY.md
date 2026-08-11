# Politique de sécurité

## Périmètre sensible

Les défauts suivants sont prioritaires : écriture sur le mauvais volume, restauration incomplète, traversée de chemin dans une archive, corruption silencieuse d’un fichier audio, contournement d’une confirmation, exécution de contenu non fiable et téléchargement de firmware depuis une origine non approuvée.

## Signaler un problème

Ne publiez pas immédiatement une procédure reproductible si elle peut provoquer une perte de données ou l’installation silencieuse d’un firmware. Ouvrez un avis de sécurité privé GitHub pour le dépôt, en indiquant :

- version ou commit concerné ;
- système d’exploitation ;
- modèle exact et version OS de l’OP‑1 si pertinent ;
- résultat attendu et résultat observé ;
- fixture ou journal expurgé de toute donnée personnelle.

Ne joignez jamais un firmware propriétaire ni la sauvegarde complète d’une machine.

## Engagements de conception

- comparaison de l’identité du volume avant chaque écriture ;
- validation canonique de tous les chemins ;
- manifestes SHA‑256 et vérification après copie ;
- origine HTTPS officielle épinglée pour le firmware standard ;
- aucun mode expert activé par défaut ;
- journaux locaux sans audio, secrets ni chemins personnels complets.

