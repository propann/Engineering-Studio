"use client";
import { useEffect, useRef } from "react";
import { analyseur } from "@studio-hub/rack-bus";

/**
 * L'oscilloscope du rack, dessiné en gros pixels.
 *
 * ## D'où il vient
 *
 * C'est la seule idée récupérée de `StrudelLiveStudio.tsx`, la page orpheline
 * supprimée le 2026-08-29. Le reste de cette page était une maquette : elle
 * n'importait jamais Strudel, annonçait « code compilé et évalué avec succès »
 * sans rien évaluer, et jouait un motif de seize pas figé quel que soit le code
 * tapé. Son tracé d'onde, lui, était réel.
 *
 * ## Ce qui change par rapport à l'original
 *
 * L'original fabriquait son propre `AudioContext` et son propre `AnalyserNode`
 * — le défaut que `rack-bus` existe pour corriger. Il ne voyait donc que son
 * propre son, jamais celui du reste de l'atelier.
 *
 * Celui-ci lit `analyseur()`, l'analyseur du bus maître. Il montre **tout ce
 * qui sort du rack** : Strudel, mais aussi les moteurs DSP si l'on en a laissé
 * un branché. C'est plus utile, et c'est gratuit.
 *
 * ## Le dessin
 *
 * Quantifié sur une grille : au lieu d'une courbe lisse, on moyenne les
 * échantillons par colonne de `PIXEL` points et l'on remplit des carrés. Une
 * ligne anti-crénelée jurerait au milieu d'une interface sans un seul coin
 * arrondi.
 */

/** Côté d'un pixel logique, en pixels CSS. */
const PIXEL = 4;

export function OscilloscopePixel({
  actif,
  hauteur = 72,
  couleur = "#7cf07c",
}: {
  /** Ne tourne que pendant la lecture : une boucle d'images au repos coûte pour rien. */
  actif: boolean;
  hauteur?: number;
  couleur?: string;
}) {
  const toile = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = toile.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let image: number | null = null;
    let an: AnalyserNode | null = null;
    try {
      an = analyseur();
    } catch {
      // Pas de contexte audio : rien à tracer, et surtout rien à signaler —
      // l'oscilloscope est décoratif.
      return;
    }
    const donnees = new Uint8Array(an.frequencyBinCount);

    /** Ajuste la toile à sa taille réelle, densité d'écran comprise. */
    const dimensionner = () => {
      const r = canvas.getBoundingClientRect();
      const d = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(r.width * d));
      canvas.height = Math.max(1, Math.floor(r.height * d));
      ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    dimensionner();

    const fond = () => {
      const r = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, r.width, r.height);
      // La ligne de zéro, en pointillés carrés.
      ctx.fillStyle = "rgba(124, 240, 124, .18)";
      for (let x = 0; x < r.width; x += PIXEL * 2) {
        ctx.fillRect(x, Math.floor(r.height / 2), PIXEL, 1);
      }
      return r;
    };

    const tracer = () => {
      if (!an) return;
      an.getByteTimeDomainData(donnees);
      const r = fond();
      const colonnes = Math.floor(r.width / PIXEL);
      const parColonne = Math.max(1, Math.floor(donnees.length / colonnes));

      ctx.fillStyle = couleur;
      for (let c = 0; c < colonnes; c += 1) {
        // Moyenner la colonne plutôt que d'échantillonner un point : un seul
        // point pris au hasard ferait scintiller le tracé d'une image à
        // l'autre sans que le son ait changé.
        let somme = 0;
        const debut = c * parColonne;
        for (let i = 0; i < parColonne; i += 1) somme += donnees[debut + i] ?? 128;
        const v = somme / parColonne / 128 - 1;
        const y = Math.round(((1 - v) * r.height) / 2 / PIXEL) * PIXEL;
        ctx.fillRect(
          c * PIXEL,
          Math.min(r.height - PIXEL, Math.max(0, y)),
          PIXEL,
          PIXEL,
        );
      }
      image = requestAnimationFrame(tracer);
    };

    if (actif) {
      image = requestAnimationFrame(tracer);
    } else {
      fond();
    }

    const surRedimension = () => {
      dimensionner();
      if (!actif) fond();
    };
    window.addEventListener("resize", surRedimension);

    return () => {
      if (image !== null) cancelAnimationFrame(image);
      window.removeEventListener("resize", surRedimension);
    };
  }, [actif, couleur]);

  return (
    <canvas
      ref={toile}
      className="sr-scope"
      style={{ height: `${hauteur}px` }}
      // Décoratif : le son est déjà décrit par l'état du transport, et un
      // lecteur d'écran n'a rien à faire d'un tracé d'onde.
      aria-hidden="true"
    />
  );
}
