/**
 * themeManager.ts — Gestion globale du Thème Sombre (Dark) / Clair (Light)
 * pour tout le studio, persisté dans le localStorage et synchronisé avec le profil utilisateur.
 */

export type AppTheme = "dark" | "light";

const THEME_STORAGE_KEY = "engineering-studio-theme";

export function getStoredTheme(): AppTheme {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    // Vérification du profil si existant
    const profileRaw = window.localStorage.getItem("studio-hub-profile");
    if (profileRaw) {
      const parsed = JSON.parse(profileRaw);
      if (parsed.theme === "LIGHT" || parsed.theme === "light") return "light";
    }
  } catch {
    // fallback
  }
  return "dark";
}

export function applyTheme(theme: AppTheme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  if (theme === "light") {
    root.classList.add("theme-light");
    root.classList.remove("theme-dark");
    document.body.style.backgroundColor = "#ebece6";
    document.body.style.color = "#111311";
  } else {
    root.classList.add("theme-dark");
    root.classList.remove("theme-light");
    document.body.style.backgroundColor = "#0e1314";
    document.body.style.color = "#edf2f7";
  }
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    // Déclenchement d'un événement personnalisé pour informer tous les composants
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
  } catch {
    // Ignorer si stockage inaccessible
  }
}

export function toggleTheme(): AppTheme {
  const current = getStoredTheme();
  const next: AppTheme = current === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}
