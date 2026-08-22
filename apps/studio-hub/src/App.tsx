import { lazy, Suspense, useEffect, useState } from "react";
import Landing from "./pages/Landing";

/**
 * Pages chargees a la demande.
 *
 * Elles etaient toutes importees statiquement, si bien que la page d'accueil
 * embarquait l'application entiere — dont deux stations audio completes,
 * ep133-studio (8800 lignes) et op1-studio (9500 lignes), qu'un visiteur
 * telechargeait sans jamais les ouvrir.
 *
 * Landing reste en import direct : c'est la premiere vue affichee, la
 * differer n'ajouterait qu'un ecran d'attente.
 */
const ToolsHub = lazy(() => import("./pages/ToolsHub"));
const ProfileCreator = lazy(() => import("./pages/ProfileCreator"));
const Documentation = lazy(() => import("./pages/Documentation"));
const Exercises = lazy(() => import("./pages/Exercises"));
const DocOP1 = lazy(() => import("./pages/DocOP1"));
const DocEP133 = lazy(() => import("./pages/DocEP133"));
const RhythmHero = lazy(() => import("./pages/RhythmHero"));
const ImageEditorOP1 = lazy(() => import("./pages/ImageEditorOP1"));
const FirmwareCompiler = lazy(() => import("./pages/FirmwareCompiler"));
const FirmwareLab = lazy(() => import("./pages/FirmwareLab"));
const ThemeEditor = lazy(() => import("./pages/ThemeEditor"));
const ThemeProjectEditor = lazy(() => import("./pages/ThemeProjectEditor"));
const AdvancedImageEditor = lazy(() => import("./pages/AdvancedImageEditor"));
const SoundPatchCreator = lazy(() => import("./pages/SoundPatchCreator"));
const AudioPluginRack = lazy(() => import("./pages/AudioPluginRack"));
const SoundLibrary = lazy(() => import("./pages/SoundLibrary"));
const EP133StudioPage = lazy(() => import("./pages/EP133StudioPage"));
const OP1StudioPage = lazy(() => import("./pages/OP1StudioPage"));
const MidiSettings = lazy(() => import("./pages/MidiSettings"));
const OP1Settings = lazy(() => import("./pages/OP1Settings"));
const BackupLab = lazy(() => import("./pages/BackupLab"));
const OrphanPages = lazy(() => import("./pages/OrphanPages"));

type Page = 
  | "landing" 
  | "outils" 
  | "profil" 
  | "documentation" 
  | "exercises" 
  | "doc-op1" 
  | "doc-ep133" 
  | "studio-ep133"
  | "studio-op1"
  | "rhythm-hero" 
  | "image-editor-op1" 
  | "firmware-lab"
  | "firmware-compiler"
  | "theme-editor" 
  | "theme-project"
  | "advanced-image"
  | "sound-patch-creator"
  | "audio-plugin-rack"
  | "sound-library"
  | "midi-settings"
  | "op1-settings"
  | "backup-lab"
  | "orphan-pages";

const PAGES = new Set<Page>([
  "landing", "outils", "profil", "documentation", "exercises", "doc-op1", "doc-ep133",
  "studio-ep133", "studio-op1", "rhythm-hero", "image-editor-op1", "firmware-lab",
  "firmware-compiler", "theme-editor", "theme-project", "advanced-image", "sound-patch-creator",
  "audio-plugin-rack", "sound-library", "midi-settings", "op1-settings", "backup-lab", "orphan-pages",
]);

function pageDepuisUrl(): Page {
  if (typeof window === "undefined") return "landing";
  const candidate = window.location.hash.replace(/^#\/?/, "") || "landing";
  return PAGES.has(candidate as Page) ? candidate as Page : "landing";
}

export function App() {
  const [currentPage, setCurrentPage] = useState<Page>(() => pageDepuisUrl());

  useEffect(() => {
    const naviguer = (page: Page) => {
      if (!PAGES.has(page)) return;
      const url = new URL(window.location.href);
      url.hash = page === "landing" ? "/" : `/${page}`;
      window.history.pushState({ page }, "", url);
      setCurrentPage(page);
    };
    const synchroniser = () => setCurrentPage(pageDepuisUrl());
    (window as Window & { navigateMaquette?: (page: Page) => void }).navigateMaquette = naviguer;
    window.addEventListener("popstate", synchroniser);
    window.addEventListener("hashchange", synchroniser);
    return () => {
      window.removeEventListener("popstate", synchroniser);
      window.removeEventListener("hashchange", synchroniser);
      const target = window as Window & { navigateMaquette?: (page: Page) => void };
      if (target.navigateMaquette === naviguer) delete target.navigateMaquette;
    };
  }, []);

  // `key` force le remontage a chaque changement de page : sans elle,
  // Suspense reutilise la frontiere precedente et l'ecran d'attente ne
  // s'affiche pas lors d'une navigation.
  return (
    <Suspense key={currentPage} fallback={<EcranChargement />}>
      {rendrePage(currentPage, setCurrentPage)}
    </Suspense>
  );
}

/** Ecran d'attente pendant le telechargement d'une page. */
function EcranChargement() {
  return (
    <div className="page-loading" role="status" aria-live="polite">
      <span>Chargement…</span>
    </div>
  );
}

function rendrePage(currentPage: Page, setCurrentPage: (p: Page) => void) {
  switch (currentPage) {
    case "outils":
      return <ToolsHub />;
    case "profil":
      return <ProfileCreator />;
    case "documentation":
      return <Documentation />;
    case "exercises":
      return <Exercises />;
    case "doc-op1":
      return <DocOP1 />;
    case "doc-ep133":
      return <DocEP133 />;
    case "studio-ep133":
      return <EP133StudioPage />;
    case "studio-op1":
      return <OP1StudioPage />;
    case "rhythm-hero":
      return <RhythmHero />;
    case "image-editor-op1":
      return <ImageEditorOP1 />;
    case "firmware-lab":
    case "firmware-compiler":
    case "theme-editor":
    case "theme-project":
      return <FirmwareLab />;
    case "advanced-image":
      return <AdvancedImageEditor />;
    case "sound-patch-creator":
      return <SoundPatchCreator onClose={() => setCurrentPage("outils")} />;
    case "midi-settings":
      return <MidiSettings />;
    case "op1-settings":
      return <OP1Settings />;
    case "backup-lab":
      return <BackupLab />;
    case "orphan-pages":
      return <OrphanPages />;
    case "audio-plugin-rack":
      return <AudioPluginRack onClose={() => setCurrentPage("outils")} />;
    case "sound-library":
      return <SoundLibrary />;
    case "landing":
    default:
      return <Landing />;
  }
}
