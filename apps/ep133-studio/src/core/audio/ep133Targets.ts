/**
 * Cibles de conversion EP-133 et estimation de poids.
 *
 * L'implémentation vit dans `@studio-hub/audio-formats` : le rack fabrique des
 * samples et doit connaître les specs des machines, or il n'y avait pas accès
 * tant qu'elles restaient ici.
 *
 * La contrainte d'origine est conservée là-bas et mérite d'être rappelée : ce
 * module reste sans dépendance lourde, délibérément séparé de `wavConvert.ts`
 * qui importe `@alexanderolsen/libsamplerate-js` (~2 Mo de glue WASM) au niveau
 * module. C'est ce qui permet de l'importer statiquement — depuis
 * `WaveformTrim.tsx` par exemple, pour afficher un poids en direct — sans tirer
 * le convertisseur dans le bundle principal.
 */
export {
  EP133_TARGET_SAMPLE_RATES,
  estimateEp133ConversionBytes,
  estimateEp133MemoryFit,
  type Ep133TargetRate,
  type Ep133MemoryFit,
} from '@studio-hub/audio-formats';
