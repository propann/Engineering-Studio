import { TopBar } from "../components/TopBar";
import OP1App from "../../../op1-studio/app/page";

export default function OP1StudioPage() {
  return (
    <div className="studio-app-wrapper">
      <TopBar activePage="studio-op1" />
      <OP1App />
    </div>
  );
}
