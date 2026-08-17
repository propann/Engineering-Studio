# Workspace local — permissions et reconnexion

Le Hub est le seul endroit où l’utilisateur choisit le dossier maître. Les
studios reçoivent ensuite un handle local limité à leur sous-dossier ; aucun
chemin n’est envoyé à un service distant.

## Parcours normal

1. Dans **Construis ton atelier**, choisir le dossier maître.
2. Le Hub crée les dossiers `shared`, `op1/*` et `ep133/*` nécessaires.
3. Le handle est conservé dans IndexedDB (`studio-hub-workspace`) pour
   retrouver le dossier au rechargement.
4. Au premier coffre ou transfert, le navigateur peut demander à nouveau la
   permission `read` ou `readwrite`.
5. Le bouton **Connecter/Changer** permet de sélectionner un autre dossier si
   l’autorisation est refusée, si le volume a changé ou si le handle n’est
   plus valide.

## Refus ou perte d’accès

- Une permission refusée ne déclenche aucune copie et n’efface pas le profil.
- Un handle restauré depuis IndexedDB peut rester présent mais nécessiter une
  nouvelle autorisation ; il faut alors reconnecter le dossier depuis le Hub.
- Un disque retiré, renommé ou débranché doit être reconnecté avant une
  sauvegarde/restauration.
- Les studios affichent une erreur locale et restent utilisables hors machine
  pour les éditeurs, la documentation et les tests MIDI virtuels.

## Garanties d’écriture

Le coffre demande `readwrite` uniquement au démarrage explicite d’une
sauvegarde ou restauration. Chaque fichier écrit est relu et comparé par
taille/SHA‑256 ; une copie invalide est refusée et son snapshot incomplet est
nettoyé lorsqu’il est possible de le supprimer.
