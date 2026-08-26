import type { HTMLAttributes } from "react";

export type StatusTone = "ready" | "test" | "offline" | "readonly" | "warning" | "danger";

const STATUS_SYMBOL: Record<StatusTone, string> = {
  ready: "✓",
  test: "◆",
  offline: "○",
  readonly: "◇",
  warning: "!",
  danger: "×",
};

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone: StatusTone;
}

export function StatusBadge({ tone, className = "", children, ...props }: StatusBadgeProps) {
  return (
    <span {...props} className={`ui-status ui-status--${tone} ${className}`.trim()}>
      <span aria-hidden="true">{STATUS_SYMBOL[tone]}</span>
      <span>{children}</span>
    </span>
  );
}
