import { useId, type ReactNode } from "react";
import { Button } from "./Button";

export function EmptyState({
  title,
  cause,
  consequence,
  actionLabel,
  onAction,
  icon,
}: {
  title: string;
  cause: string;
  consequence: string;
  actionLabel: string;
  onAction: () => void;
  icon?: ReactNode;
}) {
  const titleId = useId();
  return (
    <section className="ui-empty-state" aria-labelledby={titleId}>
      {icon && <div className="ui-empty-state__icon" aria-hidden="true">{icon}</div>}
      <div>
        <span className="ui-empty-state__kicker">RIEN À AFFICHER</span>
        <h2 id={titleId}>{title}</h2>
        <p><strong>Cause :</strong> {cause}</p>
        <p><strong>Conséquence :</strong> {consequence}</p>
      </div>
      <Button onClick={onAction}>{actionLabel}</Button>
    </section>
  );
}
