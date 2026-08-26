import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { initializeStudioTheme } from "./core/theme";
import "./styles.css";
import "./styles-maquette-map.css";
import "./themes.css";
import "./ui/ui.css";

initializeStudioTheme();
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
