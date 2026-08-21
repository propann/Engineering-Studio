/**
 * Lecture AIFF pour l'EP-133.
 *
 * Ce fichier portait une copie de l'analyseur de `op1-studio`, annoncée en
 * commentaire comme « adaptée de OP-1 Studio ». Comparés jeton à jeton le
 * 2026-08-21, `parseAiffFormat` et `readAiffSample` étaient logiquement
 * identiques des deux côtés : seuls la mise en forme et les guillemets
 * différaient. Deux analyseurs de format binaire libres de diverger en
 * silence, dont celui-ci dans un répertoire que le typecheck n'inspecte pas.
 *
 * L'implémentation vit désormais dans `@studio-hub/audio-formats`. Ce fichier
 * ne garde que la ré-exportation, pour que les composants qui l'importent
 * restent inchangés.
 */
export {
  parseAiffFormat,
  readAiffSample,
  extractAiffInterleaved,
  isAiffFormat,
  getAiffMetadata,
  type ParsedAiffFormat,
} from '@studio-hub/audio-formats';
