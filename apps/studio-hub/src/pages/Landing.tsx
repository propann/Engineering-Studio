"use client";
import { useEffect, useState } from "react";
import { readProfileName } from "../core/profile";
import { AppShell, Button, Card, PageHeader, StatusBadge } from "../ui";

export default function Home() {
  const [profileName, setProfileName] = useState("NOUVEAU MEMBRE");

  useEffect(() => {
    setProfileName(readProfileName());
  }, []);

  const openTool = (toolId: string) => {
    if (toolId === "op1") (window as any).navigateMaquette("studio-op1");
    else if (toolId === "ep133") (window as any).navigateMaquette("studio-ep133");
    else if (toolId === "sounds") (window as any).navigateMaquette("sound-library");
    else if (toolId === "visual") (window as any).navigateMaquette("image-editor-op1");
    else if (toolId === "profil") (window as any).navigateMaquette("profil");
    else if (toolId === "backup") (window as any).navigateMaquette("backup-lab");
    else if (toolId === "training") (window as any).navigateMaquette("exercises");
    else if (toolId === "settings") (window as any).navigateMaquette("midi-settings");
    else (window as any).navigateMaquette("outils");
  };

  return (
    <AppShell activePage="landing" profileName={profileName} className="landing-v2">
      <details className="landing-test-alert">
        <summary>
          <StatusBadge tone="danger">Écriture machine non validée</StatusBadge>
          <span>Serveur public de test — lire avant toute restauration</span>
        </summary>
        <p>La restauration et l’écriture vers une machine ne sont pas validées de bout en bout. Garde toujours une copie indépendante.</p>
      </details>

      <PageHeader
        eyebrow="WORKSPACE LOCAL · OP-1 + EP-133"
        title={<>Deux machines.<br /><em>Un atelier.</em></>}
        description="Prépare tes sons, entraîne-toi et protège tes projets dans une interface locale, sans faux cloud."
        status={<StatusBadge tone="test">Version expérimentale</StatusBadge>}
        action={<Button variant="secondary" onClick={() => openTool("hub")}>Voir tous les outils</Button>}
      />

      <section className="landing-machine-grid" aria-label="Studios des machines">
        <MachineCard machine="op1" onOpen={() => openTool("op1")} />
        <MachineCard machine="ep133" onOpen={() => openTool("ep133")} />
      </section>

      <section className="landing-proof-strip" aria-label="Garanties du workspace">
        <span><b>LOCAL</b>Données dans le navigateur</span>
        <span><b>LISIBLE</b>Atelier et Studio</span>
        <span><b>PRUDENT</b>Aucune écriture implicite</span>
      </section>

      <nav className="landing-shortcuts" aria-label="Outils principaux">
        <Button variant="secondary" onClick={() => openTool("backup")} icon={<span aria-hidden="true">▣</span>}>Sauvegardes</Button>
        <Button variant="secondary" onClick={() => openTool("sounds")} icon={<span aria-hidden="true">♫</span>}>Sons</Button>
        <Button variant="secondary" onClick={() => openTool("training")} icon={<span aria-hidden="true">◆</span>}>Apprendre</Button>
        <Button variant="secondary" onClick={() => openTool("settings")} icon={<span aria-hidden="true">⚙</span>}>Réglages</Button>
        <Button variant="secondary" onClick={() => openTool("visual")} icon={<span aria-hidden="true">▦</span>}>Images OP-1</Button>
      </nav>
    </AppShell>
  );
}

function MachineCard({ machine, onOpen }: { machine: "op1" | "ep133"; onOpen: () => void }) {
  const op1 = machine === "op1";
  const name = op1 ? "OP-1 Studio" : "EP-133 Studio";
  return (
    <Card
      variant="machine"
      className={`landing-machine landing-machine--${machine}`}
      eyebrow={op1 ? "SYNTH · TAPE · DRUM" : "SAMPLE · PADS · PATTERNS"}
      title={name}
      footer={<span>OUVRIR {name.toUpperCase()} ↗</span>}
      onActivate={onOpen}
      accessibleName={`Ouvrir ${name}`}
    >
      <div className="landing-machine__visual">
        <img src={op1 ? "/media/op1.jpeg" : "/media/ep133.jpeg"} alt={op1 ? "Teenage Engineering OP-1" : "Teenage Engineering EP-133 K.O. II"} />
      </div>
      <StatusBadge tone="test">Test</StatusBadge>
    </Card>
  );
}
