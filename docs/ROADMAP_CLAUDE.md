# 📜 FEUILLE DE ROUTE TECHNIQUE & CONTRATS D'EXÉCUTION — SPÉCIAL CLAUDE
> **Statut :** Prêt pour exécution autonome  
> **Cible :** Sous-agent Claude / Développeur Tandem  
> **Règle d'or :** Typage strict TypeScript, zéro code fantôme (`// TODO`), zéro régression, tests unitaires obligatoires (Vitest).

---

## 🎯 OBJECTIFS & PÉRIMÈTRE
Tu es chargé de consolider et d'étendre les briques **Git Musical Décentralisé** (`packages/music-git`) et **Live Jam P2P** (`packages/p2p-collab`) au sein de la plateforme **Engineering Studio**.

---

## 🏗️ ARCHITECTURE & EMPLACEMENT DES FICHIERS

| Module / Package | Rôle & Responsabilité | Fichiers Clés |
| :--- | :--- | :--- |
| `packages/music-git/` | Moteur de versioning musical décentralisé (CAS SHA-256, Branches, Commits, Fusion anti-écrasement). | `gitEngine.ts`, `types.ts`, `hash.ts`, `musicGit.test.ts` |
| `packages/p2p-collab/` | Transport P2P WebRTC / BroadcastChannel, diffusion de paquets MIDI, chat horodaté. | `p2pEngine.ts`, `cryptoIdentity.ts`, `types.ts`, `p2pCollab.test.ts` |
| `apps/studio-hub/src/pages/` | Interface utilisateur du studio de co-création (`CollabStudio.tsx`). | `CollabStudio.tsx` |
| `apps/studio-hub/src/racks/` | Modules enfichables dans le Rack Principal / Labo (`ModuleCollabGit.tsx`). | `ModuleCollabGit.tsx`, `ModuleCollabGit.test.ts` |

---

## 📋 TÂCHES ATOMIQUES À RÉALISER

### 🔷 TÂCHE 1 : Extension du Moteur de Tags et de Revert Git (`packages/music-git/gitEngine.ts`)

#### 1.1 Contexte & Spécification
Permettre d'étiqueter un commit spécifique (ex: `"v1.0-master"`, `"radio-edit"`) et d'effectuer un `revert` propre sans altérer les snapshots précédents.

#### 1.2 Signature des Méthodes à Implémenter dans `MusicGitRepository` :
```typescript
// Dans packages/music-git/gitEngine.ts

export interface MusicTag {
  name: string;
  commitId: string;
  annotatedBy?: string;
  timestamp: number;
}

// Méthodes à ajouter dans la classe MusicGitRepository :
createTag(name: string, commitId?: string, authorName?: string): MusicTag;
getTags(): MusicTag[];
deleteTag(name: string): boolean;
revert(commitId: string, author: { name: string; avatar?: string }): Promise<MusicCommit>;
```

#### 1.3 Règles de Validation & Cas Limites :
- `createTag` doit lever une exception si le nom du tag existe déjà.
- Si `commitId` n'est pas fourni, cibler le `headCommitId` de la branche active.
- `revert` doit récupérer le snapshot du commit cible, créer un nouveau commit sur la branche active avec le message `"Revert to [commitId-prefix]"` et mettre à jour le pointeur de branche.

---

### 🔷 TÂCHE 2 : Support des Automations de Paramètres dans le Snapshot (`packages/music-git/types.ts`)

#### 2.1 Contexte & Spécification
Ajouter le support des courbes d'automation (Cutoff, Résonance, Volume, Pan, LFO Speed) dans chaque piste du snapshot musical.

#### 2.2 Schéma de Données TypeScript à enrichir :
```typescript
// Dans packages/music-git/types.ts

export interface ParameterAutomationPoint {
  step: number;        // Position dans la grille (0..63)
  value: number;       // Valeur normalisée 0..127 ou 0.0..1.0
  curve?: "linear" | "exponential" | "instant";
}

export interface TrackAutomationLane {
  targetParameter: "filter_cutoff" | "filter_resonance" | "volume" | "pan" | "send_fx";
  points: ParameterAutomationPoint[];
}

// Ajouter le champ optionnel dans MusicTrackLane :
export interface MusicTrackLane {
  id: string;
  name: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  color?: string;
  patterns: MusicPattern[];
  automations?: TrackAutomationLane[]; // <-- NOUVEAU
}
```

#### 2.3 Règle de Fusion (Merge) :
Lors d'un `merge` entre deux branches :
- Si la branche distante modifie une courbe d'automation sur une piste existante sans conflit de pattern, appliquer l'automation.
- En cas de divergence sur les points d'automation, créer la piste alternative avec sa propre courbe sans perte de données.

---

### 🔷 TÂCHE 3 : Indicateur de Qualité de Connexion & Ping P2P (`packages/p2p-collab/p2pEngine.ts`)

#### 3.1 Contexte & Spécification
Ajouter un mécanisme régulier d'écho (Ping / Pong) pour mesurer la latence réseau en millisecondes de chaque pair connecté.

#### 3.2 Protocole de Paquet :
```typescript
// Dans packages/p2p-collab/types.ts
export type CollabPacketType =
  | "PEER_JOIN"
  | "PEER_LEAVE"
  | "TRANSPORT_SYNC"
  | "LIVE_MIDI"
  | "CHAT_MESSAGE"
  | "PING"  // <-- NOUVEAU
  | "PONG"; // <-- NOUVEAU

export interface PingPacketPayload {
  timestamp: number;
}
```

#### 3.3 Comportement du Moteur :
1. Chaque pair envoie périodiquement un paquet `PING` avec son horodatage local `Date.now()`.
2. Le récepteur répond immédiatement par un `PONG` contenant le même horodatage.
3. À la réception du `PONG`, l'émetteur calcule `latencyMs = Date.now() - payload.timestamp` et met à jour le champ `latencyMs` dans la liste `ConnectedPeer`.

---

### 🔷 TÂCHE 4 : Gestion de Clés Client (.studio-key) & Profils Signés (`packages/p2p-collab/cryptoIdentity.ts`)

#### 4.1 Contexte & Spécification
Permettre à chaque musicien d'exporter son trousseau d'identité client sous forme de fichier `.studio-key` (JSON chiffré/signé) et de le réimporter pour retrouver son pseudo, son avatar, ses droits et signer ses commits Music-Git.

#### 4.2 Signature des Méthodes :
```typescript
export interface StudioKeyExport {
  version: "1.0";
  identity: CryptoIdentity;
  signature: string;
  exportedAt: number;
}

export function exportStudioKeyFile(identity: CryptoIdentity): string;
export function importStudioKeyFile(rawJson: string): CryptoIdentity;
```

---

### 🔷 TÂCHE 5 : Chat Multi-Canaux & Partage Musical Intégré (`packages/p2p-collab/types.ts`)

#### 5.1 Contexte & Spécification
Structurer les messages du chat par canaux (`#general`, `#stems`, `#mix-master`, `#live-jam`, `#idees`) et permettre l'envoi de fragments musicaux (presets, pistes, snippets Strudel).

```typescript
export type ChatChannelId = "general" | "stems" | "mix-master" | "live-jam" | "idees";

export interface ChatAttachment {
  type: "stem_audio" | "midi_pattern" | "synth_preset" | "strudel_code";
  title: string;
  payload: unknown;
}

export interface ChatMessage {
  id: string;
  channel?: ChatChannelId;
  author: CryptoIdentity;
  text: string;
  timestamp: number;
  attachment?: ChatAttachment;
}
```

---

### 🔷 TÂCHE 6 : Double Rack de Synthèse & Live-Coding Strudel

#### 6.1 Contexte & Spécification
- Séparer l'exécution sonore en **Rack A** (Mélodies/Leads : Plaits, Braids, Rings, Clouds, Elements, Helm, Dexed) et **Rack B** (Basses/Percussions : Open303, Amy, PL Synth, Faust DSP, ZynAddSubFX).
- Connecter l'interpréteur Strudel au bus MIDI partagé et à la chaîne de son.

---

## 🧪 VALIDATION & TESTS OBLIGATOIRES

Avant de valider ton travail, tu **DOIS** exécuter et faire passer l'ensemble de la suite de tests :

```bash
# 1. Vérification des tests music-git
npx vitest run packages/music-git/musicGit.test.ts

# 2. Vérification des tests p2p-collab
npx vitest run packages/p2p-collab/p2pCollab.test.ts

# 3. Vérification des tests racks & studio
npx vitest run apps/studio-hub/src/racks/ModuleCollabGit.test.ts

# 4. Vérification complète du monorepo (900+ tests)
npm test

# 5. Compilation & Vérification des types
npm run typecheck
npm run build
```

---

## 🛡️ CONSIGNES STRICTES DE CODAGE POUR CLAUDE
1. **Pas de `any` non justifié** : Utilise des interfaces strictes et des types génériques.
2. **Pas de suppression de code existant** : Toutes les fonctionnalités (CAS SHA-256, merge anti-écrasement, WebAudio, pads MIDI) doivent être préservées.
3. **Immutabilité** : Ne modifie jamais directement les objets du snapshot ; retourne toujours de nouvelles copies nettoyées.
4. **Local-First** : Aucun appel réseau vers des serveurs tiers. Tout reste 100% navigateur et WebRTC pair-à-pair.
