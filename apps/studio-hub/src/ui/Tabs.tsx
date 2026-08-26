import type { KeyboardEvent } from "react";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  disabled?: boolean;
}

export function nextTabIndex(current: number, direction: 1 | -1, disabled: boolean[]) {
  if (!disabled.length || disabled.every(Boolean)) return current;
  let next = current;
  do next = (next + direction + disabled.length) % disabled.length;
  while (disabled[next]);
  return next;
}

export function Tabs<T extends string>({
  label,
  items,
  selected,
  onChange,
}: {
  label: string;
  items: TabItem<T>[];
  selected: T;
  onChange: (id: T) => void;
}) {
  const activateByIndex = (index: number) => {
    const item = items[index];
    if (!item?.disabled) onChange(item.id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const disabled = items.map((item) => Boolean(item.disabled));
    let target: number | null = null;
    if (event.key === "ArrowRight") target = nextTabIndex(index, 1, disabled);
    if (event.key === "ArrowLeft") target = nextTabIndex(index, -1, disabled);
    if (event.key === "Home") target = disabled.findIndex((value) => !value);
    if (event.key === "End") {
      for (let cursor = disabled.length - 1; cursor >= 0; cursor -= 1) {
        if (!disabled[cursor]) { target = cursor; break; }
      }
    }
    if (target === null || target < 0) return;
    event.preventDefault();
    activateByIndex(target);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role=tab]")[target]?.focus();
  };

  return (
    <div className="ui-tabs" role="tablist" aria-label={label}>
      {items.map((item, index) => (
        <button
          type="button"
          role="tab"
          key={item.id}
          aria-selected={selected === item.id}
          tabIndex={selected === item.id ? 0 : -1}
          disabled={item.disabled}
          onClick={() => onChange(item.id)}
          onKeyDown={(event) => onKeyDown(event, index)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
