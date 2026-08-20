import { TopBar } from "../components/TopBar";
import EP133App from "../../../ep133-studio/src/App";

export default function EP133StudioPage() {
  return (
    <div className="studio-app-wrapper">
      <TopBar activePage="studio-ep133" />
      <EP133App embeddedMode />
    </div>
  );
}
