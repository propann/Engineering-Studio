import { useState } from "react";
import Landing from "./pages/Landing";
import ToolsHub from "./pages/ToolsHub";
import ProfileCreator from "./pages/ProfileCreator";
import Documentation from "./pages/Documentation";
import Exercises from "./pages/Exercises";
import DocOP1 from "./pages/DocOP1";
import DocEP133 from "./pages/DocEP133";
import RhythmHero from "./pages/RhythmHero";
import ImageEditorOP1 from "./pages/ImageEditorOP1";
import FirmwareGallery from "./pages/FirmwareGallery";
import ThemeEditor from "./pages/ThemeEditor";

type Page = "landing" | "outils" | "profil" | "documentation" | "exercises" | "doc-op1" | "doc-ep133" | "rhythm-hero" | "image-editor-op1" | "firmware-gallery" | "theme-editor";

export function App() {
  const [currentPage, setCurrentPage] = useState<Page>("landing");

  // Navigation helper pour les pages
  (window as any).navigateMaquette = (page: Page) => setCurrentPage(page);

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
    case "rhythm-hero":
      return <RhythmHero />;
    case "image-editor-op1":
      return <ImageEditorOP1 />;
    case "firmware-gallery":
      return <FirmwareGallery />;
    case "theme-editor":
      return <ThemeEditor />;
    case "landing":
    default:
      return <Landing />;
  }
}
