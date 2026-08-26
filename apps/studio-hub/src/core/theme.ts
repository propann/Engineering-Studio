export const STUDIO_THEME_KEY = "engineering-studio-theme";

export type StudioTheme = "atelier" | "studio";

export function isStudioTheme(value: unknown): value is StudioTheme {
  return value === "atelier" || value === "studio";
}

export function readStudioTheme(): StudioTheme {
  if (typeof window === "undefined") return "atelier";
  try {
    const stored = window.localStorage.getItem(STUDIO_THEME_KEY);
    return isStudioTheme(stored) ? stored : "atelier";
  } catch {
    return "atelier";
  }
}

export function applyStudioTheme(theme: StudioTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme === "studio" ? "dark" : "light";
}

export function saveStudioTheme(theme: StudioTheme) {
  applyStudioTheme(theme);
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STUDIO_THEME_KEY, theme);
  } catch {
    // Le thème reste actif pour la session même si le stockage est indisponible.
  }
}

export function initializeStudioTheme() {
  const theme = readStudioTheme();
  applyStudioTheme(theme);
  return theme;
}
