import type { LocalProfile } from "../lib/profile";

export function LocalProfilePanel({ profile, onChange }: { profile: LocalProfile; onChange: (profile: LocalProfile) => void }) {
  const machine = profile.machines[0];
  return <section className="local-profile-panel" aria-labelledby="local-profile-title"><div className="mod-section-heading"><div><span className="section-label">PROFIL LOCAL</span><strong id="local-profile-title">Votre atelier</strong></div><small>Sans compte · hors ligne</small></div><label><span>Pseudo d’affichage</span><input value={profile.pseudo} onChange={(event) => onChange({ ...profile, pseudo: event.target.value })} /></label><label><span>Nom de la machine</span><input value={machine?.name ?? ""} placeholder="Mon OP-1" onChange={(event) => onChange({ ...profile, machines: [{ ...(machine ?? {}), name: event.target.value }] })} /></label></section>;
}
