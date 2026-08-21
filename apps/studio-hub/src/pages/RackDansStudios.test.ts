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
const OP1 = readFileSync(
  path.join(DIR, "..", "..", "..", "op1-studio", "app", "page.tsx"),
  "utf-8"
);
const CSS_OP1 = readFileSync(
  path.join(DIR, "..", "..", "..", "op1-studio", "app", "globals.css"),
  "utf-8"
);
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

describe("le rack dans le studio OP-1", () => {
  const bloc = () => {
    const i = OP1.indexOf("<AudioPluginRack");
    expect(i).toBeGreaterThan(-1);
    return OP1.slice(i, i + 300);
  };

  it("lit bien le source du studio, pas un fichier vide", () => {
    expect(OP1.length).toBeGreaterThan(10000);
  });

  it("importe le rack du hub", () => {
    // L'OP-1 n'avait aucun moteur de synthese : op1SynthEngine joue des
    // samples. Sans cet import, le panneau ci-dessous ne rendrait rien.
    expect(OP1).toMatch(/import AudioPluginRack from .*AudioPluginRack/);
  });

  it("suit le motif des panneaux repliables du studio", () => {
    // L'ecran OLED et le clavier machine se replient deja ainsi. Un rack qui
    // inventerait sa propre navigation romprait la coherence de la page.
    expect(OP1).toMatch(/const \[rackFolded, setRackFolded\] = useState\(/);
    expect(OP1).toContain('<div className="studio-slide-panel studio-rack-panel"');
  });

  it("part replie, contrairement aux deux autres panneaux", () => {
    // `useState(true)` = replie. Le rack monte un AudioContext et pose des
    // ecouteurs clavier : il n'a rien a faire la tant qu'on ne l'ouvre pas.
    expect(OP1).not.toContain("const [rackFolded, setRackFolded] = useState(false);");
  });

  it("offre un moyen de l'ouvrir", () => {
    // Un panneau replie par defaut et sans bouton serait du code mort.
    expect(OP1).toContain("setRackFolded(!rackFolded)");
  });

  it("donne au panneau une hauteur, sinon le rack s'effondre", () => {
    // Le rack en tiroir prend `height: 100%` : dans la colonne qui defile de
    // l'OP-1, un parent sans hauteur le reduit a rien. Defaut invisible au
    // typecheck comme au build — le panneau existe, il est juste vide.
    expect(CSS_OP1).toMatch(/\.studio-rack-panel \{[^}]*height:/);
  });

  it("passe enTiroir — sinon deux TopBar, dont une qui demonte le studio", () => {
    expect(bloc()).toContain("enTiroir");
  });

  it("coupe le clavier quand le rack est replie", () => {
    // Les ecouteurs du rack sont poses sur `window` : replie, il jouerait des
    // notes sous les doigts de quelqu'un qui pilote la machine.
    expect(bloc()).toMatch(/clavierActif=\{!rackFolded\}/);
  });

  it("donne au rack un moyen de se fermer", () => {
    expect(bloc()).toMatch(/onClose=\{\(\) => setRackFolded\(true\)\}/);
  });
});
