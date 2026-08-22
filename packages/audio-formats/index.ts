/**
 * Formats audio des machines, partagés par le rack et les deux studios.
 *
 * Le rack fabrique le son ; les studios le préparent pour la machine. Les deux
 * ont besoin des mêmes encodeurs et des mêmes analyseurs, qui vivaient jusqu'ici
 * dans les studios — donc hors de portée du rack, qui ne pouvait rien exporter.
 *
 * Le WAV, lui, était déjà partagé : son analyse vit dans
 * `@studio-hub/audio-bridge` depuis plus longtemps.
 */
export * from "./aiff.ts";
export * from "./encode.ts";
export * from "./machines.ts";
export * from "./op1Patch.ts";
export * from "./op1Pack.ts";
