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
import FirmwareCompiler from "./pages/FirmwareCompiler";
import FirmwareLab from "./pages/FirmwareLab";
import ThemeEditor from "./pages/ThemeEditor";
import ThemeProjectEditor from "./pages/ThemeProjectEditor";
import AdvancedImageEditor from "./pages/AdvancedImageEditor";
import SoundEditorHub from "./pages/SoundEditorHub";
import SoundPatchCreator from "./pages/SoundPatchCreator";
import AudioPluginRack from "./pages/AudioPluginRack";
import EP133StudioPage from "./pages/EP133StudioPage";
import OP1StudioPage from "./pages/OP1StudioPage";

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
  | "firmware-gallery" 
  | "firmware-compiler"
  | "theme-editor" 
  | "theme-project"
  | "advanced-image"
  | "sound-editor"
  | "sound-patch-creator"
  | "audio-plugin-rack";

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
    case "studio-ep133":
      return <EP133StudioPage />;
    case "studio-op1":
      return <OP1StudioPage />;
    case "rhythm-hero":
      return <RhythmHero />;
    case "image-editor-op1":
      return <ImageEditorOP1 />;
    case "firmware-lab":
    case "firmware-gallery":
    case "firmware-compiler":
    case "theme-editor":
    case "theme-project":
      return <FirmwareLab />;
    case "advanced-image":
      return <AdvancedImageEditor />;
    case "sound-editor":
      return <SoundEditorHub onClose={() => setCurrentPage("outils")} />;
    case "sound-patch-creator":
      return <SoundPatchCreator onClose={() => setCurrentPage("outils")} />;
    case "audio-plugin-rack":
      return <AudioPluginRack onClose={() => setCurrentPage("outils")} />;
    case "landing":
    default:
      return <Landing />;
  }
}
