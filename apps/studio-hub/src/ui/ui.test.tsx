import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";
import { Card } from "./Card";
import { StatusBadge } from "./StatusBadge";
import { nextTabIndex, Tabs } from "./Tabs";

describe("composants UI fondamentaux", () => {
  it("rend un bouton de chargement réellement désactivé", () => {
    const html = renderToStaticMarkup(<Button loading>Importer</Button>);
    expect(html).toContain("disabled");
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Chargement…");
  });

  it("refuse une carte interactive sans nom accessible", () => {
    expect(() => renderToStaticMarkup(<Card onActivate={() => undefined}>Contenu</Card>)).toThrow(/accessibleName/);
  });

  it("associe forme, symbole et texte aux statuts", () => {
    const html = renderToStaticMarkup(<StatusBadge tone="danger">Écriture non validée</StatusBadge>);
    expect(html).toContain("ui-status--danger");
    expect(html).toContain("Écriture non validée");
    expect(html).toContain("×");
  });

  it("saute les onglets désactivés et boucle", () => {
    expect(nextTabIndex(0, 1, [false, true, false])).toBe(2);
    expect(nextTabIndex(2, 1, [false, true, false])).toBe(0);
    expect(nextTabIndex(0, -1, [false, true, false])).toBe(2);
  });

  it("rend le contrat ARIA des onglets", () => {
    const html = renderToStaticMarkup(<Tabs label="Machine" items={[{ id: "op1", label: "OP-1" }, { id: "ep133", label: "EP-133" }]} selected="op1" onChange={() => undefined} />);
    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('tabindex="-1"');
  });
});
