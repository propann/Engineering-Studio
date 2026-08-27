import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import config from "../../../vite.config";

/**
 * Le build sait dire quel commit il porte.
 *
 * Sans ce marqueur, savoir ce que sert la production demandait de comparer des
 * empreintes de feuilles CSS a la main. Le 2026-08-26 le Hub public a servi
 * pendant des heures un build anterieur a cinq commits, CI verte, sans que
 * rien ne le signale : Coolify surveille le depot lui-meme, `deploy.yml` ne
 * declenche aucun deploiement, et quand la surveillance ne part pas personne
 * n'est prevenu.
 *
 * Ces tests appellent le plugin au lieu de chercher son nom dans le fichier :
 * un plugin present mais casse passerait une verification textuelle.
 */

const RACINE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

/** Les balises que le plugin injecte, en l'executant pour de vrai. */
function balisesInjectees() {
  const plugins = (config as { plugins?: unknown[] }).plugins ?? [];
  const plat = plugins.flat(Infinity) as { name?: string; transformIndexHtml?: unknown }[];
  const marqueur = plat.find((p) => p && p.name === "marqueur-de-build");
  expect(marqueur, "le plugin `marqueur-de-build` n'est plus branche dans vite.config.ts").toBeTruthy();

  const hook = marqueur!.transformIndexHtml;
  const appel = typeof hook === "function" ? hook : (hook as { handler: Function }).handler;
  const sortie = appel.call(marqueur, "", {} as never) as {
    tag: string;
    attrs: Record<string, string>;
    injectTo: string;
  }[];
  return sortie;
}

describe("le build porte son commit", () => {
  it("le plugin injecte bien deux balises meta dans <head>", () => {
    const balises = balisesInjectees();
    expect(balises).toHaveLength(2);
    for (const b of balises) {
      expect(b.tag).toBe("meta");
      expect(b.injectTo).toBe("head");
    }
  });

  it("le commit annonce est un vrai SHA, ou « inconnu » assume", () => {
    const commit = balisesInjectees().find((b) => b.attrs.name === "build-commit");
    expect(commit, "la balise build-commit a disparu").toBeTruthy();
    const valeur = commit!.attrs.content;
    // Soit quarante caracteres hexadecimaux, soit l'aveu. Jamais une chaine
    // vide : une valeur vide passerait pour un marqueur absent et enverrait
    // chercher un probleme de deploiement la ou il n'y en a pas.
    expect(valeur, "un marqueur vide est pire qu'absent").not.toBe("");
    expect(
      /^[0-9a-f]{40}$/.test(valeur) || valeur === "inconnu",
      `build-commit vaut « ${valeur} » : ni un SHA ni « inconnu »`,
    ).toBe(true);
  });

  /**
   * Le chemin que la PRODUCTION emprunte.
   *
   * En construction distante il n'y a pas toujours de `.git` : Coolify et
   * Nixpacks exposent le commit par variable d'environnement. C'est donc cette
   * branche-la qui sert vraiment, et la seule que le poste local n'exerce
   * jamais — ici `git rev-parse` repond toujours.
   *
   * Le repli « inconnu », lui, reste hors de portee sous test pour la meme
   * raison. C'est assume : il n'est atteint que sans depot NI variable.
   */
  it("une variable d'environnement l'emporte sur le depot local", () => {
    const avant = process.env.SOURCE_COMMIT;
    process.env.SOURCE_COMMIT = "0123456789abcdef0123456789abcdef01234567";
    try {
      const commit = balisesInjectees().find((b) => b.attrs.name === "build-commit");
      expect(commit!.attrs.content).toBe("0123456789abcdef0123456789abcdef01234567");
    } finally {
      if (avant === undefined) delete process.env.SOURCE_COMMIT;
      else process.env.SOURCE_COMMIT = avant;
    }
  });

  it("la date annoncee est lisible par Date", () => {
    const date = balisesInjectees().find((b) => b.attrs.name === "build-date");
    expect(date, "la balise build-date a disparu").toBeTruthy();
    expect(Number.isNaN(Date.parse(date!.attrs.content))).toBe(false);
  });
});

describe("le verificateur de deploiement reste appelable", () => {
  /**
   * Le script est le seul consommateur du marqueur. S'il disparait ou change
   * de nom, le marqueur ne sert plus a rien et personne ne s'en apercoit.
   */
  it("le script existe et lit les deux balises", () => {
    const source = readFileSync(path.join(RACINE, "scripts/verifie-deploiement.mjs"), "utf-8");
    expect(source).toContain("build-commit");
    expect(source).toContain("build-date");
  });

  it("package.json expose la commande", () => {
    const pkg = JSON.parse(readFileSync(path.join(RACINE, "package.json"), "utf-8"));
    expect(pkg.scripts.deploiement).toContain("scripts/verifie-deploiement.mjs");
  });
});
