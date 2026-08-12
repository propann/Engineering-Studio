type FirmwareSection = "build" | "graphics";

export function FirmwareSubtabs({ section, onSelect }: { section: FirmwareSection; onSelect: (section: FirmwareSection) => void }) {
  return <div className="firmware-subtabs" role="tablist" aria-label="Sections Firmware"><button type="button" className={section === "build" ? "is-active" : ""} onClick={() => onSelect("build")}>Plan &amp; build</button><button type="button" className={section === "graphics" ? "is-active" : ""} onClick={() => onSelect("graphics")}>Graphismes</button></div>;
}
