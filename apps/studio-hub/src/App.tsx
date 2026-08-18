import { useState } from "react";
import Landing from "./pages/Landing";
import ToolsHub from "./pages/ToolsHub";
import ProfileCreator from "./pages/ProfileCreator";

type Page = "landing" | "outils" | "profil";

export function App() {
  const [currentPage, setCurrentPage] = useState<Page>("landing");

  // Navigation helper pour les pages
  (window as any).navigateMaquette = (page: Page) => setCurrentPage(page);

  switch (currentPage) {
    case "outils":
      return <ToolsHub />;
    case "profil":
      return <ProfileCreator />;
    case "landing":
    default:
      return <Landing />;
  }
}
