# Contribuer à OP‑1 Studio

Merci de vouloir améliorer le projet. La priorité n’est pas la quantité de fonctions, mais la confiance : une opération de fichiers doit être compréhensible, réversible autant que possible et testée sans mettre une vraie machine en danger.

## Principes

1. **Original d’abord.** Ne pas supposer que l’OP‑1 Field partage les mêmes chemins ou formats.
2. **Lecture seule par défaut.** La découverte et l’indexation ne modifient jamais le volume connecté.
3. **Plan avant écriture.** Toute mutation produit une liste de changements examinable.
4. **Sauvegarde avant risque.** Une restauration, un nettoyage ou une mise à jour demande un instantané valide.
5. **Pas de contenu propriétaire.** Ne jamais committer firmware, manuel, patch ou audio sans licence compatible.
6. **Tests sur fixture.** Les tests utilisent une arborescence factice ; le matériel réel vient seulement après validation.

## Proposition de changement

- Ouvrir d’abord une issue pour une fonction qui touche au firmware, à la restauration ou au format de bande.
- Garder les changements petits et expliquer le scénario utilisateur.
- Ajouter des tests pour les chemins, noms, limites audio et erreurs d’éjection.
- Mettre à jour la documentation et le registre des décisions si une hypothèse change.
- Signaler clairement les essais effectués avec une machine réelle et la version de son OS.

## Convention de commits

Utiliser un préfixe simple : `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `build:` ou `chore:`. Une contribution ne doit pas mélanger une refonte visuelle et une opération critique de périphérique.

## Ajout d’une dépendance

Documenter : URL officielle, version épinglée, licence SPDX, rôle, plateforme, surface de risque et solution de repli. Toute dépendance exécutée sur un firmware ou une sauvegarde doit être appelée dans un processus isolé avec des entrées validées.

