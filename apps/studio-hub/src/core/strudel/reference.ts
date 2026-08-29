/**
 * La documentation de Strudel, embarquée.
 *
 * ## Pourquoi elle est recopiée ici plutôt que liée
 *
 * La documentation officielle vit sur strudel.cc. Y renvoyer serait une ligne
 * de code — et ferait de l'atelier une page qui ne marche plus hors ligne,
 * exactement ce que le rack refuse pour les échantillons. Un lien s'ouvre
 * aussi hors du Hub, donc on perd le motif en cours.
 *
 * Le compromis tenu : une référence courte et vérifiée, consultable à côté de
 * l'éditeur sans quitter la page ni toucher au réseau. Elle ne remplace pas la
 * documentation complète, et le dit.
 *
 * ## Ce qui est garanti
 *
 * Tout ce qui est écrit ici est jouable avec les seuls synthés locaux. Les
 * fonctions citées existent dans `@strudel/core`, `@strudel/mini` et
 * `@strudel/tonal`, aux versions verrouillées par `bun.lock`. Les noms de sons
 * viennent de `sons.ts`, qui les relève dans la source de superdough.
 */

export type EntreeDoc = {
  /** Ce qu'on tape. */
  syntaxe: string;
  /** Ce que ça fait, en une phrase. */
  effet: string;
  /** Un exemple complet, qui sonne tel quel. */
  exemple?: string;
};

export type SectionDoc = {
  id: string;
  titre: string;
  /** Le paragraphe d'ouverture. Une idée, pas un cours. */
  intro: string;
  entrees: EntreeDoc[];
};

export const SECTIONS_DOC: ReadonlyArray<SectionDoc> = [
  {
    id: "mini-notation",
    titre: "Mini-notation",
    intro:
      "Le cœur de Strudel. Ce qui est entre guillemets n'est pas du texte : " +
      "c'est un motif. Les espaces découpent le temps, et le cycle dure " +
      "toujours autant — plus il y a d'éléments, plus ils sont rapides.",
    entrees: [
      {
        syntaxe: '"a b c"',
        effet: "Trois événements qui se partagent un cycle, à parts égales.",
        exemple: 'note("c e g")',
      },
      {
        syntaxe: '"a ~ b"',
        effet: "Le tilde est un silence. Il occupe sa place dans le cycle.",
        exemple: 'note("c ~ e ~")',
      },
      {
        syntaxe: '"a*4"',
        effet: "Répète l'élément quatre fois dans son intervalle.",
        exemple: 'note("c*4 e")',
      },
      {
        syntaxe: '"a/2"',
        effet: "Étale l'élément sur deux cycles — il ne joue qu'un cycle sur deux.",
        exemple: 'note("c/2 e")',
      },
      {
        syntaxe: '"[a b] c"',
        effet: "Les crochets groupent : le groupe occupe une seule place.",
        exemple: 'note("[c e] g")',
      },
      {
        syntaxe: '"<a b c>"',
        effet: "Les chevrons alternent : un élément par cycle, à tour de rôle.",
        exemple: 'note("<c e g>")',
      },
      {
        syntaxe: '"a, b"',
        effet: "La virgule superpose. Les deux motifs jouent ensemble.",
        exemple: 'note("c3, g3, e4")',
      },
      {
        syntaxe: '"a(3,8)"',
        effet:
          "Rythme euclidien : trois frappes réparties au mieux sur huit temps.",
        exemple: 'note("c2(3,8)").sound("square")',
      },
      {
        syntaxe: '"a?"',
        effet: "Joue l'élément une fois sur deux, au hasard.",
        exemple: 'note("c e? g e?")',
      },
      {
        syntaxe: '"a!3"',
        effet: "Répète l'élément trois fois, chacun gardant sa propre place.",
        exemple: 'note("c!3 g")',
      },
    ],
  },
  {
    id: "sources",
    titre: "Sources",
    intro:
      "Ce qui fabrique les événements. `note` et `n` produisent des hauteurs, " +
      "`sound` choisit le timbre. Sans `.sound()`, Strudel utilise une " +
      "sinusoïde par défaut.",
    entrees: [
      {
        syntaxe: 'note("c e g")',
        effet:
          "Des notes, en notation anglaise. `c3`, `eb4`, `f#2` — le chiffre est l'octave.",
        exemple: 'note("c3 eb3 g3 bb3")',
      },
      {
        syntaxe: 'n("0 2 4").scale("C:minor")',
        effet:
          "Des degrés dans une gamme, plutôt que des notes absolues. Transposer devient trivial.",
        exemple: 'n("0 2 4 6").scale("C:minor").sound("triangle")',
      },
      {
        syntaxe: 's("sbd*4")',
        effet: "Un motif de sons percussifs. Raccourci de `.sound()`.",
        exemple: 's("sbd*4, white*8").gain(0.7)',
      },
      {
        syntaxe: "stack(a, b)",
        effet: "Superpose plusieurs motifs. L'équivalent de la virgule, en JS.",
        exemple:
          'stack(\n  note("c2 g2").sound("square"),\n  note("c4 e4 g4").sound("triangle")\n)',
      },
      {
        syntaxe: "cat(a, b)",
        effet: "Enchaîne les motifs, un par cycle.",
        exemple: 'cat(note("c e g"), note("f a c5"))',
      },
      {
        syntaxe: "silence",
        effet: "Le motif vide. Utile pour couper une voix sans l'effacer.",
      },
    ],
  },
  {
    id: "temps",
    titre: "Temps",
    intro:
      "Strudel compte en cycles, pas en battements. `setcps` fixe le nombre de " +
      "cycles par seconde ; le rack le calcule à partir du tempo partagé du " +
      "Hub, donc on n'a normalement pas à y toucher.",
    entrees: [
      {
        syntaxe: ".fast(2)",
        effet: "Deux fois plus rapide. `.slow(2)` fait l'inverse.",
        exemple: 'note("c e g").fast(2)',
      },
      {
        syntaxe: ".rev()",
        effet: "Joue le cycle à l'envers.",
        exemple: 'note("c e g b").rev()',
      },
      {
        syntaxe: ".every(4, f)",
        effet: "Applique une transformation un cycle sur quatre.",
        exemple: 'note("c e g").every(4, x => x.rev())',
      },
      {
        syntaxe: ".off(0.125, f)",
        effet:
          "Superpose une copie décalée. L'écho rythmique de base du live coding.",
        exemple: 'note("c e g").off(0.125, x => x.add(12))',
      },
      {
        syntaxe: ".segment(8)",
        effet: "Échantillonne un signal continu en huit pas par cycle.",
        exemple: 'note(sine.range(48, 72).segment(8))',
      },
      {
        syntaxe: "setcps(0.5)",
        effet:
          "Cycles par seconde. Le rack le pilote depuis le tempo du Hub — à éviter ici.",
      },
    ],
  },
  {
    id: "son",
    titre: "Timbre et filtre",
    intro:
      "Ce qui façonne le son après la note. Toutes ces fonctions acceptent un " +
      "motif à la place d'un nombre : `.cutoff(\"400 2000\")` module au rythme.",
    entrees: [
      {
        syntaxe: '.sound("sawtooth")',
        effet: "Choisit le timbre. Voir l'onglet « Sons » pour la liste locale.",
        exemple: 'note("c e g").sound("supersaw")',
      },
      {
        syntaxe: ".gain(0.8)",
        effet: "Volume de la voix, de 0 à 1 environ.",
      },
      {
        syntaxe: ".cutoff(1200)",
        effet: "Fréquence de coupure du passe-bas, en hertz.",
        exemple: 'note("c2 g2").sound("sawtooth").cutoff(800)',
      },
      {
        syntaxe: ".resonance(12)",
        effet: "Résonance du filtre. Au-delà de 20, ça siffle.",
      },
      {
        syntaxe: ".attack(0.01).decay(0.2).sustain(0.4).release(0.3)",
        effet: "L'enveloppe d'amplitude, en secondes (sauf `sustain`, un niveau).",
        exemple: 'note("c e g").attack(0.001).decay(0.15).sustain(0)',
      },
      {
        syntaxe: ".pan(0.2)",
        effet: "Panoramique, de 0 (gauche) à 1 (droite).",
      },
      {
        syntaxe: ".room(0.4)",
        effet: "Réverbération de la voix.",
      },
      {
        syntaxe: ".delay(0.5).delaytime(0.125)",
        effet: "Écho : le premier règle le mélange, le second l'intervalle.",
      },
      {
        syntaxe: ".vowel('a')",
        effet: "Filtre formant. Fait « parler » une dent de scie.",
        exemple: 'note("c3 e3 g3").sound("sawtooth").vowel("<a e i o>")',
      },
    ],
  },
  {
    id: "signaux",
    titre: "Signaux continus",
    intro:
      "Des courbes, pas des événements. On les branche là où un nombre est " +
      "attendu, pour que le paramètre respire au lieu de rester figé.",
    entrees: [
      {
        syntaxe: "sine",
        effet: "Sinusoïde lente entre 0 et 1. Voir aussi `saw`, `tri`, `square`.",
        exemple:
          'note("c e g b").sound("sawtooth").cutoff(sine.range(200, 3000).slow(4))',
      },
      { syntaxe: "rand", effet: "Nombre au hasard entre 0 et 1, continu." },
      {
        syntaxe: "perlin",
        effet: "Bruit de Perlin : aléatoire, mais qui varie doucement.",
      },
      {
        syntaxe: ".range(a, b)",
        effet: "Redimensionne un signal de 0-1 vers l'intervalle voulu.",
      },
      {
        syntaxe: "irand(8)",
        effet: "Entier au hasard sous 8. Pratique pour piocher un indice.",
      },
    ],
  },
  {
    id: "harmonie",
    titre: "Gammes et accords",
    intro:
      "Fourni par `@strudel/tonal`. Permet d'écrire en degrés et de laisser la " +
      "gamme décider des hauteurs.",
    entrees: [
      {
        syntaxe: '.scale("C:minor")',
        effet:
          "Interprète les nombres de `n()` comme des degrés de cette gamme.",
        exemple: 'n("0 2 4 6 7").scale("D:dorian").sound("triangle")',
      },
      {
        syntaxe: ".transpose(12)",
        effet: "Transpose en demi-tons. 12 vaut une octave.",
      },
      {
        syntaxe: ".add(7)",
        effet: "Ajoute aux valeurs. Sur `n()`, décale dans la gamme.",
      },
      {
        syntaxe: '.voicing()',
        effet: "Répartit un accord nommé en voix jouables.",
      },
    ],
  },
];

/**
 * Les raccourcis clavier du rack.
 *
 * Ceux de l'éditeur officiel, pour qu'un motif copié depuis strudel.cc se
 * pilote de la même façon. Ils sont déclarés ici, et non dans le composant,
 * afin que le panneau d'aide ne puisse pas mentir sur ce qui est câblé.
 */
export const RACCOURCIS: ReadonlyArray<{ touches: string; effet: string }> = [
  { touches: "Ctrl · Entrée", effet: "Évaluer le code et jouer" },
  { touches: "Ctrl · .", effet: "Tout couper (PANIC)" },
  { touches: "Échap", effet: "Tout couper (PANIC)" },
  { touches: "Ctrl · S", effet: "Enregistrer le projet" },
  { touches: "Ctrl · O", effet: "Ouvrir un projet" },
  { touches: "Ctrl · /", effet: "Commenter la sélection" },
];

/**
 * Ce que cette référence ne couvre pas.
 *
 * Affiché en pied du panneau. L'honnêteté sur la portée évite qu'on prenne
 * l'absence d'une fonction ici pour son absence dans Strudel.
 */
export const LIMITE_DOC =
  "Référence courte, tenue à la main. Strudel expose plusieurs centaines de " +
  "fonctions : celles qui touchent aux échantillons distants, au MIDI d'entrée " +
  "et au rendu hors ligne ne sont pas décrites ici.";
