/**
 * Conversion audio OP-1.
 *
 * L'implémentation vit dans `@studio-hub/audio-formats` : le rack fabrique des
 * samples et doit pouvoir les encoder, or il n'avait pas accès à ce code tant
 * qu'il restait ici. Ce fichier ne garde que la ré-exportation, pour que les
 * composants de l'OP-1 qui l'importent restent inchangés.
 */
export {
  encodeAiffPcm16,
  encodeWavPcm16,
  convertToOp1Audio,
  type ConversionOptions,
  type ConversionResult,
} from '@studio-hub/audio-formats';
