import { useEffect, useRef } from "react";
import { Button } from "./Button";

export function ConfirmDialog({
  open,
  title,
  consequence,
  confirmLabel,
  onConfirm,
  onCancel,
  dangerous = false,
}: {
  open: boolean;
  title: string;
  consequence: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  dangerous?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>("button:not(:disabled), [href], [tabindex]:not([tabindex='-1'])")];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="ui-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <div ref={dialogRef} className={`ui-dialog ${dangerous ? "ui-dialog--danger" : ""}`} role="alertdialog" aria-modal="true" aria-labelledby="ui-dialog-title" aria-describedby="ui-dialog-consequence">
        <span className="ui-dialog__kicker">{dangerous ? "ACTION IRRÉVERSIBLE" : "CONFIRMATION"}</span>
        <h2 id="ui-dialog-title">{title}</h2>
        <p id="ui-dialog-consequence">{consequence}</p>
        <div className="ui-dialog__actions">
          <Button ref={cancelRef} variant="secondary" onClick={onCancel}>Annuler</Button>
          <Button variant={dangerous ? "danger" : "primary"} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
