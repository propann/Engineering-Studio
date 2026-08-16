# EP-133: Player Profile Integration (Cool UI Patterns)

**Purpose**: Show how Player Profile appears in EP-133 Studio visually & functionally  
**Status**: UI/UX Specification  
**Date**: 15 August 2026  

---

## 🎨 DESIGN PATTERNS

### Pattern 1: Welcome Greeting (Hero Section)

**When user enters EP-133 from Hub:**

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                                                     │
│                  🥁 EP-133 K.O. II                  │
│                                                     │
│              Welcome back, Alex! 🎵                 │
│                                                     │
│   👤 Alex (Level 65 - Rhythm Master)               │
│   ⏱️  Last session: 30 minutes ago                 │
│   📊 Stats: 24 patterns | 65% training             │
│                                                     │
│                                                     │
│  ┌────────────────────────────────────┐            │
│  │  [Continue] [View Profile] [Docs]  │            │
│  └────────────────────────────────────┘            │
│                                                     │
└─────────────────────────────────────────────────────┘

Fade-in animation: 0.5s ease
```

**Code**: `src/pages/HomePage.tsx` (update)

```typescript
export function HomePage() {
  const { profile } = usePlayerProfileStore();
  const { stats } = profile || {};

  return (
    <div className="ep133-welcome">
      <div className="hero-greeting">
        <h1 className="fade-in">Welcome back, {profile?.name}! 🎵</h1>
        
        <div className="player-card fade-in-delay-1">
          <div className="avatar-large">
            {profile?.avatarEmoji || '🎵'}
          </div>
          
          <div className="player-info">
            <h2>{profile?.name}</h2>
            <p className="level">
              Level {calculateLevel(stats?.trainingProgress)} — 
              {getLevelName(stats?.trainingProgress)}
            </p>
          </div>
          
          <div className="quick-stats">
            <StatItem icon="🎛️" label="Patterns" value={stats?.patternsEdited || 0} />
            <StatItem icon="🎓" label="Training" value={`${stats?.trainingProgress || 0}%`} />
          </div>
        </div>
        
        <div className="welcome-actions">
          <button className="btn-primary">Continue to Studio</button>
          <button className="btn-secondary">View Full Profile</button>
        </div>
      </div>
    </div>
  );
}
```

---

### Pattern 2: Player Card (Top-Right Corner)

**Always visible, click to expand profile:**

```
┌─────────────────────────────────────────────────────┐
│  🏠 Hub  │ OP-1  │ EP-133  │ Docs    │  Alex 🎵   │ ← Click!
│                                                     │
│                                                     │
│        [Main Studio Content Here]                   │
│                                                     │
│                                                     │
└─────────────────────────────────────────────────────┘

Clicking "Alex 🎵" opens:

┌──────────────────────────┐
│  PLAYER PROFILE          │
│  ┌────────────────────┐  │
│  │                    │  │
│  │  Alex 🎵          │  │
│  │  Level 65         │  │
│  │  Rhythm Master    │  │
│  │                    │  │
│  └────────────────────┘  │
│                          │
│  Stats:                  │
│  • 24 patterns edited    │
│  • 65% training done     │
│  • 3.6 hours total       │
│                          │
│  Last active: 30min ago  │
│                          │
│  [Edit Profile]          │
│  [Settings]              │
│  [Back to Hub]           │
│                          │
└──────────────────────────┘
```

**Code**: `src/components/shared/PlayerCard.tsx` (NEW)

```typescript
export function PlayerCard() {
  const { profile } = usePlayerProfileStore();
  const [isOpen, setIsOpen] = useState(false);

  if (!profile) return null;

  return (
    <>
      {/* Mini Card in Header */}
      <button 
        className="player-card-mini"
        onClick={() => setIsOpen(true)}
        title="Click to view profile"
      >
        <span className="avatar-mini">{profile.avatarEmoji}</span>
        <span className="name-mini">{profile.name}</span>
      </button>

      {/* Expanded Modal */}
      {isOpen && (
        <PlayerProfileModal 
          profile={profile} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </>
  );
}

function PlayerProfileModal({ profile, onClose }) {
  const { stats } = usePlayerProfileStore();
  
  return (
    <div className="player-modal fade-in">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>✕</button>
        
        <div className="profile-header">
          <div className="avatar-large">
            {profile.avatarEmoji}
          </div>
          <h1>{profile.name}</h1>
          <p className="level">
            Level {calculateLevel(stats?.ep133?.trainingProgress)} 
            — {getLevelName(stats?.ep133?.trainingProgress)}
          </p>
        </div>

        <div className="profile-stats">
          <Stat icon="🎛️" label="Patterns Edited" value={stats?.ep133?.patternsEdited} />
          <Stat icon="🎓" label="Training Progress" value={`${stats?.ep133?.trainingProgress}%`} />
          <Stat icon="📅" label="Last Active" value={formatTime(stats?.ep133?.lastActiveAt)} />
          <Stat icon="⏱️" label="Total Edit Time" value={formatDuration(stats?.totalEditTime)} />
        </div>

        <div className="profile-actions">
          <button onClick={() => navigateToEditProfile()}>
            ✏️ Edit Profile
          </button>
          <button onClick={() => navigateToSettings()}>
            ⚙️ Settings
          </button>
          <button onClick={() => navigateToHub()}>
            🏠 Back to Hub
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### Pattern 3: Profile in Settings Panel

**Settings > Player Info:**

```
┌──────────────────────────────────────────────────┐
│  ⚙️ SETTINGS                                      │
├──────────────────────────────────────────────────┤
│                                                  │
│  PLAYER PROFILE                                  │
│  ├─ Name: Alex                                   │
│  ├─ Avatar: 🎵                                   │
│  ├─ Bio: TE enthusiast & rhythm learner         │
│  ├─ Member since: 15 Aug 2026                   │
│  │                                               │
│  ├─ STATISTICS                                   │
│  │  ├─ Patterns Created: 24                      │
│  │  ├─ Training Completed: 65%                   │
│  │  ├─ Total Edit Time: 3.6 hours                │
│  │  └─ Last Active: 30 min ago                   │
│  │                                               │
│  ├─ OWNED MACHINES                               │
│  │  ├─ ✓ EP-133 K.O. II                         │
│  │  │  ├─ Serial: EP133-99999                    │
│  │  │  ├─ FW Version: 2.30                       │
│  │  │  └─ Last Connected: 15 Aug, 09:30          │
│  │  │                                             │
│  │  └─ ✓ OP-1 Original (from Hub)               │
│  │     ├─ Serial: OP-1-12345                     │
│  │     ├─ FW Version: 240800                     │
│  │     └─ Last Connected: 15 Aug, 08:45          │
│  │                                               │
│  └─ [Edit Profile]  [Export Stats]               │
│                                                  │
├──────────────────────────────────────────────────┤
│ SYNC WITH HUB                                    │
│ Profile synced: ✓ (2 minutes ago)                │
│ Workspace: /Users/Alex/StudioProjects            │
│ [Re-sync Now]                                    │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### Pattern 4: Session Start Animation

**When launching EP-133 from Hub (cool intro):**

```
Sequence:
0.0s   | Fade in logo
       | 🥁 EP-133 K.O. II
       
0.5s   | Slide in greeting
       | Welcome back, Alex!
       
1.0s   | Show avatar + name
       | 🎵 Alex
       | Level 65 - Rhythm Master
       
1.5s   | Display quick stats
       | 📊 24 patterns | 🎓 65%
       
2.0s   | Ready button fades in
       | [Enter Studio]
       
2.5s   | Auto-transition OR wait for click
```

**Code**: `src/pages/LaunchScreen.tsx` (NEW)

```typescript
export function LaunchScreen({ onReady }) {
  const { profile } = usePlayerProfileStore();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 500),   // Logo
      setTimeout(() => setStage(2), 1000),  // Greeting
      setTimeout(() => setStage(3), 1500),  // Avatar
      setTimeout(() => setStage(4), 2000),  // Stats
      setTimeout(() => setStage(5), 2500),  // Button
    ];

    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <div className="launch-screen">
      {stage >= 1 && (
        <h1 className="logo fade-in-1">
          🥁 EP-133 K.O. II
        </h1>
      )}

      {stage >= 2 && (
        <p className="greeting slide-in-down-1">
          Welcome back, {profile?.name}!
        </p>
      )}

      {stage >= 3 && (
        <div className="avatar-display zoom-in-1">
          <div className="avatar-large">
            {profile?.avatarEmoji}
          </div>
          <h2>{profile?.name}</h2>
          <p className="level">
            Level {calculateLevel(65)} — Rhythm Master
          </p>
        </div>
      )}

      {stage >= 4 && (
        <div className="quick-stats fade-in-2">
          <StatBadge icon="🎛️" label="24 patterns" />
          <StatBadge icon="🎓" label="65% training" />
        </div>
      )}

      {stage >= 5 && (
        <button 
          className="btn-enter fade-in-3"
          onClick={onReady}
        >
          Enter Studio
        </button>
      )}
    </div>
  );
}
```

---

### Pattern 5: Mid-Session Profile Indicator

**While editing (subtle reminder):**

```
In corner of sequencer:

┌─────────────────┐
│ 🎵 Alex         │
│ Level 65        │
│                 │
│ This Session:   │
│ ⏱️  12 min     │
│ 📊 +2 patterns  │
│                 │
│ [View Stats] ←─ Click to expand
└─────────────────┘
```

**Code**: `src/components/SessionIndicator.tsx` (NEW)

```typescript
export function SessionIndicator() {
  const { profile, stats } = usePlayerProfileStore();
  const [sessionTime, setSessionTime] = useState(0);
  const [patternsThisSession, setPatternsThisSession] = useState(0);

  // Track time in session
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="session-indicator">
      <div className="indicator-compact">
        <span className="avatar-tiny">{profile?.avatarEmoji}</span>
        <span className="name">{profile?.name}</span>
        <span className="level">L{calculateLevel(stats?.ep133?.trainingProgress)}</span>
      </div>

      <div className="session-stats-mini">
        <div>⏱️ {formatSeconds(sessionTime)}</div>
        <div>📊 +{patternsThisSession}</div>
      </div>

      <button 
        className="expand-btn"
        onClick={() => openProfileModal()}
      >
        ▼
      </button>
    </div>
  );
}
```

---

### Pattern 6: Profile Integration in Main UI

**Top navigation bar (always visible):**

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  [🏠 Hub] [OP-1] [EP-133 ✓] [📚 Docs]     🎵 Alex | L65     │
│                                                              │
│                              │                              │
│                              └─ Click to open profile modal  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Styling**:
```css
.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--accent);
}

.player-profile-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-tertiary);
  border-radius: 99px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.player-profile-pill:hover {
  background: var(--accent-light);
  transform: scale(1.05);
}

.avatar-mini {
  font-size: 1.5rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
```

---

## 🎮 INTERACTIVE FEATURES

### Feature 1: Real-Time Progress Update

**As user edits patterns:**

```typescript
export function useSessionTracking() {
  const { updateStats } = usePlayerProfileStore();

  const onPatternCreated = useCallback(() => {
    updateStats({ patternsEdited: prev => prev + 1 });
    // Animation: "✨ +1 Pattern"
    showFlashMessage("+1 Pattern", "success");
  }, [updateStats]);

  const onTrainingComplete = useCallback((score: number) => {
    const newProgress = calculateProgress(score);
    updateStats({ trainingProgress: newProgress });
    
    // Level up animation?
    if (isLevelUp(newProgress)) {
      playLevelUpAnimation();
    }
  }, [updateStats]);

  return { onPatternCreated, onTrainingComplete };
}
```

---

### Feature 2: Profile-Based Personalization

**EP-133 adapts to player:**

```typescript
// Language
useEffect(() => {
  const lang = profile?.settings?.preferredLanguage;
  if (lang) setLanguage(lang);
}, [profile?.settings?.preferredLanguage]);

// Theme
useEffect(() => {
  const theme = profile?.settings?.theme;
  if (theme) setTheme(theme);
}, [profile?.settings?.theme]);

// MIDI Channel
useEffect(() => {
  const midiChannel = profile?.settings?.midiChannel;
  if (midiChannel !== undefined) setMidiChannel(midiChannel);
}, [profile?.settings?.midiChannel]);
```

---

### Feature 3: Achievement Notifications

**When user hits milestones:**

```
User patterns_edited reaches 25:

┌─────────────────────────────┐
│  🏆 ACHIEVEMENT UNLOCKED!   │
│                             │
│    25 Patterns Created      │
│                             │
│  "Pattern Architect"        │
│                             │
│  [Claim Reward] [Share]     │
└─────────────────────────────┘
```

---

## 🎨 CSS THEME INTEGRATION

**Profile colors match machine theme:**

```css
/* EP-133 Accent Color */
:root {
  --machine-primary: #FF6B35;      /* Warm orange */
  --machine-secondary: #004E89;    /* Deep blue */
  --player-accent: var(--machine-primary);
}

.player-card {
  border-left: 4px solid var(--player-accent);
  background: linear-gradient(
    135deg,
    var(--machine-primary)10,
    var(--machine-secondary)10
  );
}

/* Animations */
@keyframes profilePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.player-online {
  animation: profilePulse 2s infinite;
}
```

---

## 📱 RESPONSIVE DESIGN

**Mobile (< 768px):**
```
Profile card → Hamburger menu → Full screen modal
```

**Tablet (768px - 1024px):**
```
Profile pill visible, expands inline
```

**Desktop (> 1024px):**
```
Full profile card always visible with hover expand
```

---

## 🔌 CONNECTION POINTS

**Profile → EP-133 Initialization:**
```
App.tsx
  ├── useHubInitialization()
  ├── usePlayerProfileStore loads
  └── Components read profile:
      ├── <HomePage /> displays greeting
      ├── <TopNav /> shows player pill
      ├── <SessionIndicator /> tracks time
      └── <ProfileModal /> shows full profile
```

**EP-133 → Hub Sync:**
```
useSessionTracking()
  ├── trackPatternCreated()
  ├── trackTrainingProgress()
  └── hubCommunication.updateStats()
      └── Hub profile updated
```

---

## 🎯 SUMMARY

EP-133 now feels **connected and personal** with:
- ✅ Welcome greeting with player avatar
- ✅ Real-time profile updates
- ✅ Always-visible player indicator
- ✅ Profile modal on click
- ✅ Settings integration
- ✅ Achievement notifications
- ✅ Session tracking
- ✅ Responsive design

**Result**: Users feel like their profile travels WITH them between OP-1 and EP-133! 🌟

---

*UI/UX Specification Complete: 15 August 2026*
