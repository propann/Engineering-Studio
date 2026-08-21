import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Le rack ouvert depuis un studio.
 *
 * Ce test vit dans studio-hub parce que vitest n'inspecte que `apps/studio-hub`
 * et `packages` — mais il LIT les studios, dont le code echapperait sinon a
 * toute verification automatique.
 *
 * Ce qu'il protege : chacun des points ci-dessous casse le studio hote d'une
 * facon qui ne se voit pas en developpement, puisque le rack seul continue de
 * fonctionner parfaitement.
 */

const DIR = path.dirname(fileURLToPath(import.meta.url));
const EP133 = readFileSync(path.join(DIR, "..", "..", "..", "ep133-studio", "src", "App.tsx"), "utf-8");
const BARRE = readFileSync(
  path.join(DIR, "..", "..", "..", "ep133-studio", "src", "components", "editor", "EditorToolbar.tsx"),
  "utf-8"
);

describe("le rack dans le studio EP-133", () => {
  it("lit bien le source du studio, pas un fichier vide", () => {
    // Un chemin faux rendrait tous les tests suivants verts sans rien lire.
    expect(EP133.length).toBeGreaterThan(10000);
    expect(BARRE.length).toBeGreaterThan(1000);
  });

  it("ajoute une vue « rack » plutot qu'un ecran a part", () => {
    // L'overlay editeur a deja un selecteur de vue : s'y greffer evite
    // d'inventer une navigation de plus.
    expect(EP133).toMatch(/useState<'pattern' \| 'arrangement' \| 'rack'>/);
    expect(BARRE).toMatch(/studioView: 'pattern' \| 'arrangement' \| 'rack'/);
  });

  it("expose l'onglet dans le selecteur existant", () => {
    expect(BARRE).toContain("onStudioViewChange('rack')");
  });

  it("passe enTiroir — sinon deux TopBar, dont une qui demonte le studio", () => {
    // La TopBar du rack appelle window.navigateMaquette : un clic dedans
    // ramenerait au hub en detruisant le studio ouvert.
    const bloc = EP133.slice(EP133.indexOf("<AudioPluginRack"));
    expect(bloc.slice(0, 300)).toContain("enTiroir");
  });

  it("coupe le clavier quand le rack n'est pas la vue active", () => {
    // Les ecouteurs du rack sont poses sur `window` : en arriere-plan, il
    // jouerait des notes sous les doigts de quelqu'un qui edite ses patterns.
    const bloc = EP133.slice(EP133.indexOf("<AudioPluginRack"));
    expect(bloc.slice(0, 300)).toMatch(/clavierActif=\{studioView === 'rack'\}/);
  });

  it("donne au rack un moyen de se fermer", () => {
    const bloc = EP133.slice(EP133.indexOf("<AudioPluginRack"));
    expect(bloc.slice(0, 300)).toMatch(/onClose=\{\(\) => setStudioView\('pattern'\)\}/);
  });

  it("n'affiche pas les patterns en meme temps que le rack", () => {
    // Les deux vues se partagent la meme zone : sans exclusion, elles se
    // superposeraient.
    expect(EP133).toContain("studioView === 'pattern'");
  });
});
