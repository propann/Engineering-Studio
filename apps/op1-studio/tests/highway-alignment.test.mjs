import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

/**
 * L'ecran de chute et le clavier doivent occuper la MEME boite horizontale.
 *
 * Les deux SVG tracent leur x dans le repere `bounds` du clavier — meme `minX`,
 * meme `width` — et s'etirent en `preserveAspectRatio="none"`. Leurs colonnes
 * ne se superposent donc que si leurs deux boites font exactement la meme
 * largeur au meme endroit.
 *
 * Un `padding: 10px` a vecu sur le conteneur du clavier. Il ne decalait pas le
 * clavier d'un bloc : il le tracait dans une boite plus etroite de 20 px, donc
 * a une AUTRE echelle. L'ecart etait nul au centre et maximal aux extremes —
 * 8,7 px sur un panneau de 1000, soit 13 % d'une touche. C'est exactement le
 * genre de defaut qui passe la relecture : les deux moities restent correctes
 * chacune de son cote, et le code du retrait est a 400 lignes de celui des
 * colonnes.
 */

const SOURCE = readFileSync(new URL("../app/components/GameGuitarHeroPanel.tsx", import.meta.url), "utf-8");

/** Les valeurs gauche/droite d'un raccourci CSS `padding`. */
function retraitsHorizontaux(raccourci) {
  const parts = raccourci.trim().split(/\s+/);
  if (parts.length === 1) return [parts[0], parts[0]];
  if (parts.length === 2) return [parts[1], parts[1]];
  if (parts.length === 3) return [parts[1], parts[1]];
  return [parts[3], parts[1]];
}

const NUL = (v) => v === "0" || /^0[a-z%]*$/.test(v);

/**
 * Le bloc de style d'un conteneur, repere par un marqueur qui le precede.
 *
 * Borne par une fin explicite plutot que par un nombre de caracteres : le
 * commentaire qui explique l'alignement vit entre le marqueur et le style, et
 * une fenetre fixe s'arreterait avant d'atteindre le `padding` des qu'on
 * etoffe ce commentaire.
 */
function blocApres(marqueur, fin) {
  const i = SOURCE.indexOf(marqueur);
  assert.notEqual(i, -1, `marqueur introuvable : ${marqueur}`);
  const j = SOURCE.indexOf(fin, i);
  assert.notEqual(j, -1, `fin de bloc introuvable apres ${marqueur} : ${fin}`);
  return SOURCE.slice(i, j);
}

test("le conteneur du clavier n'a aucun retrait horizontal", () => {
  const bloc = blocApres("CLAVIER MACHINE ALIGNÉ AU PIXEL PRÈS", "<GameGuitarHeroKeyboard");
  const m = /padding:\s*"([^"]+)"/.exec(bloc);
  assert.ok(m, "le conteneur du clavier n'a plus de padding declare — verifier le bloc");
  const [g, d] = retraitsHorizontaux(m[1]);
  assert.ok(
    NUL(g) && NUL(d),
    `retrait horizontal de ${g}/${d} sur le conteneur du clavier : les colonnes de l'ecran ne tombent plus sur les touches`,
  );
});

test("l'ecran de chute n'a aucun retrait horizontal", () => {
  const bloc = blocApres('className="op1-highway-screen-oled"', "<svg");
  const m = /padding:\s*"([^"]+)"/.exec(bloc);
  if (m) {
    const [g, d] = retraitsHorizontaux(m[1]);
    assert.ok(NUL(g) && NUL(d), `retrait horizontal de ${g}/${d} sur l'ecran de chute`);
  }
});

test("les deux SVG s'etirent sans conserver le rapport", () => {
  // Avec le rapport conserve, l'un des deux serait centre dans sa boite et
  // l'alignement dependrait de la hauteur — un tout autre desaccord.
  const ecran = blocApres('className="op1-highway-screen-oled"', "<defs>");
  assert.match(ecran, /preserveAspectRatio="none"/);

  const clavier = readFileSync(new URL("../app/components/GameGuitarHeroKeyboard.tsx", import.meta.url), "utf-8");
  assert.match(clavier, /preserveAspectRatio="none"/);
});

test("les deux lisent le meme repere horizontal", () => {
  // `bounds` vient de `layoutBounds` dans les deux fichiers : un calcul propre
  // a l'un des deux divergerait a la premiere touche deplacee.
  assert.match(SOURCE, /const bounds = layoutBounds\(/);
  const clavier = readFileSync(new URL("../app/components/GameGuitarHeroKeyboard.tsx", import.meta.url), "utf-8");
  assert.match(clavier, /const bounds = layoutBounds\(/);
});

/**
 * L'ECRAN DES EXERCICES — le meme contrat, tenu autrement.
 *
 * `ExercisePanel` fait tomber ses notes dans un SVG en `preserveAspectRatio="none"`
 * et affiche dessous le clavier de `StudioMachinePanel`, qui, lui, est en
 * `xMidYMid meet`. Deux conventions differentes sous le meme alignement : ca
 * tient, mais pas par hasard, et pas inconditionnellement.
 *
 * `meet` met a l'echelle par la dimension la plus contraignante, puis centre.
 * Tant que la boite est RELATIVEMENT PLUS HAUTE que le viewBox, c'est la
 * largeur qui contraint : le contenu occupe toute la largeur, le vide se met
 * en haut et en bas, et l'axe X reste identique a `none`. Le jour ou la boite
 * devient plus LARGE que le rapport du viewBox, c'est la hauteur qui
 * contraint : le clavier se retrouve centre entre deux marges horizontales, et
 * les colonnes de l'ecran ne tombent plus sur les touches.
 *
 * Mesure sur la disposition livree, mode `notesOnly` : viewBox `5 9 30 7`,
 * rapport 4,286 ; la zone porte `aspectRatio: layoutWidth / layoutHeight`,
 * donc exactement le meme rapport, et le retrait horizontal vaut 0,0 px. Meme
 * si la regle de la feuille de style l'emportait (64/16 = 4,0), la boite
 * resterait plus haute que le viewBox, donc toujours 0 px.
 *
 * Ce que ce test verrouille, c'est la CAUSE : le rapport de la boite est tire
 * des memes bornes que le viewBox. Ecrire ce rapport en dur, ou le laisser a
 * la valeur de la feuille de style, remettrait l'alignement au hasard de la
 * disposition chargee.
 */
const MACHINE = readFileSync(new URL("../app/components/StudioMachinePanel.tsx", import.meta.url), "utf-8");
const EXERCICE = readFileSync(new URL("../app/components/ExercisePanel.tsx", import.meta.url), "utf-8");

test("le cadre du clavier tire son rapport des memes bornes que son viewBox", () => {
  assert.match(MACHINE, /const layoutWidth = bounds\.width;/);
  assert.match(MACHINE, /const layoutHeight = bounds\.height;/);
  assert.match(MACHINE, /aspectRatio: `\$\{layoutWidth\} \/ \$\{layoutHeight\}`/);
  assert.match(MACHINE, /viewBox=\{layoutViewBox\}/);
  assert.match(MACHINE, /const layoutViewBox = bounds\.viewBox;/);
});

test("l'ecran des exercices etire son repere sans conserver le rapport", () => {
  assert.match(EXERCICE, /preserveAspectRatio="none"/);
  // Et il lit le repere du clavier, pas un calcul a lui.
  assert.match(EXERCICE, /const bounds = layoutBounds\(/);
  assert.match(EXERCICE, /const screenMinX = usesPadLayout \? 0 : bounds\.minX;/);
  assert.match(EXERCICE, /const screenWidth = usesPadLayout \? 100 : bounds\.width;/);
});
