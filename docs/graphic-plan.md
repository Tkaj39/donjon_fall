# Graphic Plan — Donjon Fall

> Plan for visual redesign of all game components, ordered by priority and logical groups.

---

## PRIORITY 1 — Game Core (player sees 90 % of the time)

### A) Game Board (Board + HexTile)

| Element | Current State | Needed |
|---------|---------------|--------|
| **Hexagons** | CSS colors + grass.png texture | Final textures (grass, stone, sand?) for different field types |
| **Starting fields** | starter-field-red/blue.png | Redesign — better visual distinction |
| **Focal points** | focus.png texture + SVG star/circle | More prominent graphics — animation, glow effect |
| **Map background** | grass-dense.png | Map surroundings — decorative frame, landscape |

### B) Dice (Die)

| Element | Current State | Needed |
|---------|---------------|--------|
| **Dice body** | SVG rectangle with player color | 3D appearance, shadow, shine, wood/metal texture? |
| **Pips** | White SVG circles | Style matching theme (relief, engraving?) |
| **Stacking in tower** | Dimmed opacity 0.55 | Better visual layering, 3D tower effect |

### C) Action Panel (ActionPanel)

| Element | Current State | Needed |
|---------|---------------|--------|
| **Action buttons** | Tailwind slate colors | Icons + text, framing matching theme |
| **Active state** | Amber border | More prominent visual feedback |

### D) Score and Player Shields (ScoreBoard + PlayerShield)

| Element | Current State | Needed |
|---------|---------------|--------|
| **Shields** | 6× shield-[color].png | Final quality, consistent style |
| **Animals** | 6× animal-[type].png | Final quality, unified style |
| **VP badge** | Colored circle with number | Heraldic shield, medallions |

---

## PRIORITY 2 — Combat and Interaction

### E) Combat (CombatOverlay + CombatPowerTooltip)

| Element | Current State | Needed |
|---------|---------------|--------|
| **Overlay** | Slate-800 box | Thematic frame (parchment? stone tablet?) |
| **Strength** | Numbers in hex | Iconography — swords, shields, effects |
| **Push/Occupy buttons** | Text buttons | Icons with description |
| **Combat flash** | CSS pulsing opacity | More prominent effect — explosion, sparks |

### F) Attack Direction (DirectionPickerOverlay)

| Element | Current State | Needed |
|---------|---------------|--------|
| **Pie segments** | Semi-transparent wedges | Arrows, visual direction guidance |

### G) Field Highlights (highlights)

| Element | Current State | Needed |
|---------|---------------|--------|
| **Reachable fields** | Green (#86efac) | Animated border, pulsing |
| **Trajectory** | Cyan (#67e8f9) | Dotted path, arrows |
| **Selected trajectory** | — | Highlighted selected movement path |
| **Enemy in range** | Pink (#fca5a5) | Warning effect |

---

## PRIORITY 3 — Menu Flow (first and last impression)

### H) Intro Screens (SplashScreen + MainMenu)

| Element | Current State | Needed |
|---------|---------------|--------|
| **Background** | `bg-stone-900/60` (semi-transparent gray) | Illustration / atmospheric artwork |
| **Logo** | logo-donjon-fall.png | ✅ Done |
| **Buttons** | Tailwind bg-red-700 / stone-700 | Thematic buttons (stone, wood, relief) |
| **Spinner** | CSS circle with border-spin | Thematic loading (falling dice? coat of arms?) |

#### Main Screen Layout

```
┌────────────────────────────────────────────────────────────┐
│  MENU (side panel)   │       CANVAS (main area)              │
│─────────────────────│                                      │
│  [Player Profile]    │  Rotating content:                    │
│  [Logo]             │  • Graphic tutorial / game story      │
│                     │  • Demo game recording (replay)       │
│  Start         ▶    │  • Atmospheric illustration / artwork  │
│  Continue           │  • News / changelog                   │
│  Tutorial           │  Content changes automatically       │
│  Rules              │  (fade/slide animation, ~8s interval) │
│  Statistics         │  or reacts to menu item hover        │
│  Leaderboard        │                                      │
│  Achievements       │                                      │
│  Settings      ▶    │                                      │
│  Create Map         │                                      │
│  Authors            │                                      │
│  Quit               │                                      │
│─────────────────────│                                      │
│  v0.9.1  [💬] [🐙]  │                                      │
└─────────────────────┴──────────────────────────────────────┘
```

**Canvas (main area)** cycles through:
- **Graphic tutorial** — animated frames explaining game basics (movement, combat, towers…)
- **Demo game recording** — replay of a real match so the player can see gameplay in action
- **Atmospheric artwork** — game world illustrations, concept art
- **News** — changelog, community info

#### Main Menu Structure

```
Main Menu
├── Start
│   ├── Quick Start        — instant game with default settings
│   ├── Start vs Bot       — play against AI
│   ├── Start              — classic start (map select → players)
│   ├── Online             — network multiplayer
│   ├── Daily Challenge    — special daily scenario with specific conditions
│   └── Campaign           — story mode
├── Continue               — resume saved game (visible only if a game exists)
├── Tutorial               — interactive rules walkthrough
├── Rules                  — rules overview (RulesViewer)
├── Statistics             — games played, wins/losses, scores
├── Leaderboard            — online player ranking
├── Achievements           — unlockable trophies for completed challenges
├── Settings
│   ├── Sound              — volume, toggle sound effects
│   ├── Graphics quality   — low / medium / high (animations, effects, textures)
│   ├── Graphics style     — visual theme selection (default, retro, minimalist…)
│   ├── Language           — CS / EN toggle
│   ├── Controls           — keyboard shortcuts, mouse/touch
│   ├── Display            — fullscreen, resolution
│   └── Accessibility      — color blindness, text size
├── Create Map             — custom map editor
├── Authors                — credits, developer info
└── Quit                   — exit the game
```

**Menu panel footer:**
- **Version number** — small text (e.g. “v0.9.1”)
- **Social links** — Discord / GitHub icons
- **Post-update notice** — “What’s New” popup on first launch after update
- **Player profile** — widget at the top of the panel (name, avatar, level)

### I) Player Setup (PlayerSetup)

| Element | Current State | Needed |
|---------|---------------|--------|
| **Form layout** | Stone panel | Parchment / heraldic frame |
| **Coat of arms selection** | Grid of 6 tiles | Larger preview, selection animation |

### J) Map Selection (MapSelection)

| Element | Current State | Needed |
|---------|---------------|--------|
| **Map thumbnail** | ⚠️ TEXT PLACEHOLDER "MAP PREVIEW" | SVG mini-preview map or screenshot |
| **Cards** | Stone-800 box | Thematic cards with frame |

### K) Loading + Victory

| Element | Current State | Needed |
|---------|---------------|--------|
| **GameLoading** | Minimalist | Preparation animation, dramatic entrance |
| **VictoryScreen** | SVG crown + player color | Festive effects — confetti, glow, fanfare |

---

## PRIORITY 4 — Supplementary

### L) Rules (RulesViewer)

| Element | Current State | Needed |
|---------|---------------|--------|
| **Modal** | Dark panel, collapsible sections | Rule illustrations, diagrams |

### M) Favicon

| Element | Current State | Needed |
|---------|---------------|--------|
| **favicon.png** | Exists | Verify quality, multi-size ICO? |

---

## Priority Summary

| Priority | Groups | Impact |
|----------|--------|--------|
| **P1** | Board, Dice, Panel, Shields | Game core — player sees constantly |
| **P2** | Combat, Direction, Highlights | Key interactions — must be legible |
| **P3** | Menu, Setup, Loading, Victory | First/last impression — "wow factor" |
| **P4** | Rules, Favicon | Nice-to-have |
