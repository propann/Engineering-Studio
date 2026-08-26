import type { ReactNode } from "react";
import { TopBar } from "../components/TopBar";
import { Button } from "./Button";

export function PageHeader({
  eyebrow,
  title,
  description,
  onBack,
  status,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  onBack?: () => void;
  status?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="ui-page-header">
      <div className="ui-page-header__main">
        {onBack && <Button variant="ghost" onClick={onBack} icon={<span aria-hidden="true">←</span>}>Retour</Button>}
        {eyebrow && <span className="ui-page-header__eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {(status || action) && <div className="ui-page-header__aside">{status}{action}</div>}
    </header>
  );
}

export function AppShell({
  activePage,
  profileName,
  children,
  className = "",
  onDocClick,
  hideTopBar = false,
}: {
  activePage: string;
  profileName?: string;
  children: ReactNode;
  className?: string;
  onDocClick?: () => void;
  hideTopBar?: boolean;
}) {
  return (
    <main className={`ui-app-shell ${className}`.trim()}>
      {!hideTopBar && <TopBar activePage={activePage} profileName={profileName} onDocClick={onDocClick} />}
      {children}
    </main>
  );
}
