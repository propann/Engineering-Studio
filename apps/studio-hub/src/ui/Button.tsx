import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = "primary",
  loading = false,
  icon,
  className = "",
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps, ref) {
  const iconOnly = variant === "icon";
  if (iconOnly && !props["aria-label"] && !props.title) {
    throw new Error("Un bouton icône doit avoir aria-label ou title.");
  }

  return (
    <button
      ref={ref}
      {...props}
      type={type}
      className={`ui-button ui-button--${variant} ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? <span className="ui-button__spinner" aria-hidden="true" /> : icon}
      {!iconOnly && <span>{loading ? "Chargement…" : children}</span>}
    </button>
  );
});
