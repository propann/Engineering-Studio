#!/usr/bin/env node
/**
 * Le deploiement suit-il `main` ?
 *
 * Repond au point 6 de `docs/ORDRE_MISSION_CODEX.md` — « verifier le SHA
 * reellement deploye sur Coolify » — et au chantier P0 de la feuille de route.
 *
 * Le 2026-08-26, le Hub public a servi pendant des heures un build anterieur a
 * cinq commits, CI verte, sans que rien ne le signale. Coolify surveille le
 * depot de lui-meme et `deploy.yml` ne declenche aucun deploiement : quand la
 * surveillance ne se declenche pas, personne n'est prevenu. Le constater
 * demandait de comparer des empreintes de feuilles CSS a la main.
 *
 * Usage :
 *     node scripts/verifie-deploiement.mjs
 *     node scripts/verifie-deploiement.mjs https://autre-hote/
 *
 * Sortie 0 si le deploiement est a jour, 1 sinon. Utilisable en surveillance.
 */

import { execSync } from "node:child_process";

const URL_PAR_DEFAUT = "https://engineering-studio.duckdns.org/";
const cible = process.argv[2] ?? URL_PAR_DEFAUT;

/** Le commit local de `main`, cote origine — c'est lui qui devrait etre servi. */
function commitAttendu() {
  try {
    execSync("git fetch origin --quiet", { stdio: "ignore" });
  } catch {
    // Pas de reseau vers le depot : on compare avec ce qu'on a sous la main,
    // en le disant.
    console.warn("  (fetch impossible — comparaison avec le `main` local)");
  }
  try {
    return execSync("git rev-parse origin/main", { encoding: "utf-8" }).trim();
  } catch {
    return execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
  }
}

/** Le commit annonce par la page servie, lu dans <head> sans executer de script. */
async function commitServi(url) {
  const reponse = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(30_000) });
  if (!reponse.ok) throw new Error(`${url} repond ${reponse.status}`);
  const html = await reponse.text();
  const commit = /<meta[^>]+name=["']build-commit["'][^>]+content=["']([^"']+)["']/i.exec(html);
  const date = /<meta[^>]+name=["']build-date["'][^>]+content=["']([^"']+)["']/i.exec(html);
  return { commit: commit?.[1] ?? null, date: date?.[1] ?? null };
}

const court = (sha) => (sha && sha !== "inconnu" ? sha.slice(0, 7) : sha);

const attendu = commitAttendu();
let servi;
try {
  servi = await commitServi(cible);
} catch (erreur) {
  console.error(`✖ ${cible} injoignable : ${erreur.message}`);
  process.exit(1);
}

console.log(`  cible    ${cible}`);
console.log(`  attendu  ${court(attendu)}  (origin/main)`);

if (!servi.commit) {
  // Un build anterieur a l'ajout du marqueur ne peut pas se nommer. C'est en
  // soi la reponse : il date d'avant le 2026-08-27.
  console.error("  servi    aucun marqueur");
  console.error("");
  console.error("✖ La page servie ne porte pas de marqueur de build. Elle a donc");
  console.error("  ete construite avant qu'il existe : le deploiement est en retard.");
  process.exit(1);
}

console.log(`  servi    ${court(servi.commit)}${servi.date ? `  (${servi.date})` : ""}`);
console.log("");

if (servi.commit === attendu) {
  console.log("✔ Le deploiement sert bien le dernier commit de `main`.");
  process.exit(0);
}

// Un build qui ne sait pas se nommer n'est pas forcement en retard : il a
// seulement ete construit sans depot ni variable d'environnement. Le dire
// plutot que de comparer deux choses incomparables — la premiere version de ce
// script tentait un `git rev-list inconnu..HEAD` et crachait une erreur git
// brute a la figure de qui l'appelait.
if (servi.commit === "inconnu") {
  // La date reste exploitable. Un build POSTERIEUR au dernier commit le
  // contient tres probablement — ce n'est pas une preuve (rien n'interdit de
  // reconstruire une vieille reference), mais c'est une reponse utile, et
  // nettement mieux que de renoncer.
  const dateCommit = new Date(
    execSync(`git show -s --format=%cI ${attendu}`, { encoding: "utf-8" }).trim(),
  );
  const dateBuild = servi.date ? new Date(servi.date) : null;

  console.error("✖ Le build deploye ne sait pas quel commit il porte.");
  console.error("  Construit sans `.git` et sans variable de commit.");
  console.error("");

  if (dateBuild && !Number.isNaN(dateBuild.getTime())) {
    const minutes = Math.round((dateBuild.getTime() - dateCommit.getTime()) / 60000);
    console.error(`  dernier commit  ${dateCommit.toISOString()}`);
    console.error(`  build           ${dateBuild.toISOString()}`);
    console.error("");
    if (minutes >= 0) {
      console.error(`  Le build suit le commit de ${minutes} min : il le contient`);
      console.error("  vraisemblablement. A confirmer, pas a tenir pour acquis.");
    } else {
      console.error(`  Le build PRECEDE le commit de ${-minutes} min : il ne peut pas`);
      console.error("  le contenir. Le deploiement est en retard.");
    }
    console.error("");
  }

  console.error("  Pour trancher au lieu de deduire, exposer le SHA a la construction");
  console.error("  dans Coolify — une variable nommee SOURCE_COMMIT,");
  console.error("  COOLIFY_GIT_COMMIT_SHA, GIT_COMMIT_SHA, COMMIT_SHA ou");
  console.error("  VITE_BUILD_COMMIT suffit.");
  process.exit(1);
}

let retard = "";
try {
  const n = execSync(`git rev-list --count ${servi.commit}..${attendu}`, {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
  retard = ` — ${n} commit(s) de retard`;
} catch {
  // Le commit servi peut etre inconnu du depot local : on ne chiffre pas.
}

console.error(`✖ Le deploiement ne suit pas \`main\`${retard}.`);
console.error("");
console.error("  Coolify surveille le depot lui-meme et `deploy.yml` ne declenche");
console.error("  rien. Si l'ecart persiste, relancer le deploiement depuis Coolify,");
console.error("  ou brancher un declencheur : voir la fin de");
console.error("  `.github/workflows/deploy.yml`.");
process.exit(1);
