import type { HTMLAttributes, ReactNode } from "react";

export type CardVariant = "machine" | "tool" | "module" | "metric";

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  variant?: CardVariant;
  eyebrow?: ReactNode;
  title?: ReactNode;
  footer?: ReactNode;
  onActivate?: () => void;
  accessibleName?: string;
}

export function Card({
  variant = "module",
  eyebrow,
  title,
  footer,
  onActivate,
  accessibleName,
  className = "",
  children,
  ...props
}: CardProps) {
  const content = (
    <>
      {(eyebrow || title) && (
        <header className="ui-card__header">
          {eyebrow && <span className="ui-card__eyebrow">{eyebrow}</span>}
          {title && <h2>{title}</h2>}
        </header>
      )}
      <div className="ui-card__body">{children}</div>
      {footer && <footer className="ui-card__footer">{footer}</footer>}
    </>
  );

  if (onActivate) {
    if (!accessibleName) throw new Error("Une carte interactive doit avoir accessibleName.");
    return (
      <article className={`ui-card ui-card--${variant} ui-card--interactive ${className}`.trim()}>
        {content}
        <button type="button" className="ui-card__hit-area" onClick={onActivate} aria-label={accessibleName} />
      </article>
    );
  }

  return (
    <article {...props} className={`ui-card ui-card--${variant} ${className}`.trim()}>
      {content}
    </article>
  );
}
