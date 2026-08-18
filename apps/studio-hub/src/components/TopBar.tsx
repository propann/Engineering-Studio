"use client";

export function TopBar({ profileName = "AZOTH", onDocClick }: { profileName?: string; onDocClick?: () => void }) {
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    (window as any).navigateMaquette?.("landing");
  };

  const Link = ({ href, className, ...props }: any) => {
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      if (href === "/outils") (window as any).navigateMaquette?.("outils");
      else if (href === "/fiche-personnage") (window as any).navigateMaquette?.("profil");
      else if (href === "/") (window as any).navigateMaquette?.("landing");
    };
    return <a href={"#" + href} onClick={handleClick} className={className} {...props} />;
  };

  return (
    <header className="topbar">
      <button className="brand" onClick={handleLogoClick} style={{ border: "none", background: "none", cursor: "pointer", padding: 0 }}>
        <span className="brand-symbol">
          <i /><i /><i /><i />
        </span>
        <span>
          <strong>Engineering</strong>
          <b>Studio</b>
        </span>
      </button>
      <nav>
        {onDocClick && <button className="nav-docs-btn" onClick={onDocClick} style={{ border: "none", background: "transparent", color: "inherit", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", padding: "0.5rem 1rem", marginRight: "0.5rem" }}>📖 DOCUMENTATION</button>}
        <Link href="/outils">Outils</Link>
      </nav>
      <Link className="profile-link" href="/fiche-personnage">
        <span className="profile-orb">{profileName.slice(0, 2).toUpperCase()}</span>
        <span>
          <small>IDENTITÉ LOCALE</small>
          <strong>{profileName}</strong>
        </span>
        <b>↗</b>
      </Link>
    </header>
  );
}
