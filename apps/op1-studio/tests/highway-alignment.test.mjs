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
