import Link from "next/link";

export default function StudioHeader(){
 return <header className="studio-header">
  <Link className="studio-brand" href="/"><span className="studio-mark"><i/><i/><i/><i/></span><span><strong>Engineering</strong><b>Studio</b></span></Link>
  <nav className="studio-nav"><Link href="/">ACCUEIL</Link><Link href="/outils">OUTILS</Link><Link href="/fiche-personnage">PERSONNAGE</Link></nav>
  <Link className="studio-player" href="/fiche-personnage"><img src="/media/avatars/pixel-avatar-engineer.webp" alt="Avatar du joueur"/><span><small>PLAYER 01</small><b>AZOTH</b></span><strong>LV.01</strong></Link>
 </header>
}
