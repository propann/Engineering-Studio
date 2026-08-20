import { TopBar } from "../components/TopBar";
import { KeyboardEditor } from "../../../op1-studio/app/components/KeyboardEditor";

/**
 * Réglages > OP-1.
 *
 * Reprend la section d'édition du clavier d'op1-studio. L'éditeur est
 * autonome : il lit et écrit lui-même sa disposition sous la clé
 * `op1-studio-grid-v1`, que partagent le clavier joué du Studio et l'écran
 * Exercices. Modifier ici se répercute donc partout.
 */
export default function OP1Settings() {
  return (
    <div className="studio-app-wrapper">
      <TopBar activePage="op1-settings" />
      <main className="machine-settings-page">
        <header className="machine-settings-head">
          <h1>OP-1</h1>
          <p>
            Édition de la disposition du clavier. Elle est partagée avec le
            clavier joué du Studio et l'écran Exercices : les trois lisent la
            même grille, une modification vaut pour tous.
          </p>
        </header>
        <KeyboardEditor />
      </main>
    </div>
  );
}
