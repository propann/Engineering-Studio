import type { ReactNode } from "react";

export type ToolWindowTab = {
  id: string;
  label: string;
  icon: ReactNode;
};

type ToolWindowTabsProps = {
  tabs: ToolWindowTab[];
  activeId: string;
  onSelect: (id: string) => void;
};

export function ToolWindowTabs({ tabs, activeId, onSelect }: ToolWindowTabsProps) {
  return (
    <nav className="tool-window-tabs" aria-label="Outils OP-1 Studio">
      {tabs.map((tab) => (
        <button key={tab.id} type="button" aria-current={activeId === tab.id ? "page" : undefined} className={activeId === tab.id ? "is-active" : ""} onClick={() => onSelect(tab.id)}>
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
