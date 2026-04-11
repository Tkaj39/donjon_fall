# Graphic Plan — Donjon Fall

> Plan for visual redesign of all game components, ordered by priority and logical groups.

---

## PRIORITY 1 — Game Core (player sees 90 % of the time)

#### Game Screen Layout

```
┌────────────────────────────────────────────────────────────┐
│  [Logo]              Player glow edge                  [?] │
│────────────────────────────────────────────────────────────│
│           Turn phase indicator                              │
│────────────────────────────────────────────────────────────│
│                                                            │
│  ┌────────┐                              ┌────────┐        │
│  │ SHIELD │     ┌────────────────┐    │ SHIELD │        │
│  │ Red    │     │                │    │ Blue   │  ┌───┐ │
│  │ [crest]│     │   GAME BOARD   │    │ [crest]│  │Atk│ │
│  │ Name   │     │  (61 hexes)    │    │ Name   │  │   │ │
│  │ VP: 3  │     │                │    │ VP: 1  │  └───┘ │
│  └────────┘     │                │    └────────┘        │
│                └────────────────┘                       │
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │  [Move Tower] [Move Die] [Reroll] [Collapse]        │  │
│  └────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

**Layers (Z-index):**
1. Player glow edge (behind everything, red/blue color)
2. Game board + hexes + dice
3. Field highlights, movement animation, combat flash
4. On-board modals: CombatOverlay, DirectionPicker, CombatPowerTooltip
5. Full-screen modals: VictoryScreen, RulesViewer

### A) Game Board (Board + HexTile)

| Element | Current State | Needed |
|---------|---------------|--------|
| **Hexagons** | CSS colors + grass.png texture | Final textures (grass, stone, sand?) for different field types |
| **Starting fields** | starter-field-red/blue.png | Redesign — better visual distinction |
| **Focal points** | focus.png texture + SVG star/circle | More prominent graphics — animation, glow effect |
| **Map background** | grass-dense.png | Map surroundings — decorative frame, landscape |

### A.1) Game Screen Header

| Element | Current State | Needed |
|---------|---------------|--------|
| **Logo** | w-64 left | Keep, possibly smaller |
| **Rules button [?]** | 8×8 px right | Thematic icon (scroll, book?) |
| **Turn phase indicator** | Debug mode only | ❗ Missing — must be always visible |
| **Active player indicator** | Glow edge (gradient, 200px) | Improve — clearer signaling |

### A.2) Player Glow Edge (PlayerGlow)

| Element | Current State | Needed |
|---------|---------------|--------|
| **Position** | Fixed top/bottom per player | OK |
| **Color** | Red/blue gradient | Thematic gradient — fire/ice? |
| **Opacity** | 0.55 | Possibly soften |
| **Transition** | 0.5s | Smoother animation |

### A.3) Side Panels (PlayerShield × 2)

| Element | Current State | Needed |
|---------|---------------|--------|
| **Shield** | w-28 h-28, shield + animal PNG | Final quality, consistent style |
| **Player name** | text-xs, truncate | Larger font, better readability |
| **VP badge** | Colored circle (amber/stone) | Heraldic shield, medallions |
| **Active player** | bg-amber-400 badge | More prominent — glow, animation, frame |

### A.4) CombatPowerTooltip (right panel)

| Element | Current State | Needed |
|---------|---------------|--------|
| **SVG hex** | 72×83 px, attack number | Thematic frame, sword/shield icons |
| **Colors** | Player color | Consistent with other elements |
| **Format** | "A × D" on enemy hover | Clearer strength visualization |

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
| **Pie segments** | SVG 60° wedges, radius 0.85 × hexSize | Arrows, visual direction guidance |
| **Available segment** | Fill `rgba(251,191,36,0.18)`, stroke `rgba(251,191,36,0.75)` | More prominent — icon/arrow in segment |
| **Selected (hover)** | Fill `rgba(251,191,36,0.65)` | Scale or glow animation |
| **Interaction** | Transparent polygon catches `mousemove` | Touch: tap instead of hover |
| **Trigger** | Enemy target with >1 approach direction | — |

### G) Field Highlights (highlights)

> The game board uses 17 visual states for individual fields.
> Highlights always override textures — when a highlight is active, the grass/focus PNG disappears.

#### G.1) Field Fill Colors

| Field State | CSS Variable | Color | Trigger |
|-------------|-------------|-------|---------|
| **Default** | `--color-hex-default` | `#e8e677` (yellow) | No special state |
| **Starting field** | `--color-hex-starting` | Player tint (red `#fca5a5` / blue `#93c5fd`) | `startingField` property in map definition |
| **Focal point** | `--color-hex-focal` | `#c4b5fd` (light purple) | `focalPoint` property in map definition |
| **Selected** | `--color-hex-selected` | `#f59e0b` (amber) | Click on own die |
| **Reachable** | `--color-hex-reachable` | `#86efac` (green) | Die selected + field in range (empty/own) |
| **Trajectory** | `--color-hex-trajectory` | `#67e8f9` (cyan) | Player plans movement path |
| **Enemy reachable** | `--color-hex-enemy-reachable` | `#fca5a5` (pink) | Die selected + enemy field in range |
| **Highlighted** | `--color-hex-highlighted` | `#34d399` (emerald) | Alias for "selected" highlight |

**Priority** (last wins): default → starting → focal → highlight → selected.

**Texture override**: When a texture exists (`grass.png`, `focus.png`, `starter-field-*.png`) AND no highlight/selection is active → polygon is transparent and texture shows via `<image>` with clip-path. Any highlight overrides the texture.

#### G.2) Combat Flash

| Target | Color | Delay | Trigger |
|--------|-------|-------|---------|
| **Attacker hex** | `rgba(239,68,68,0.4)` (red) | 0s | `phase === "combat"` |
| **Defender hex** | `rgba(251,191,36,0.35)` (amber) | 0.4s | `phase === "combat"` |

**Animation** (`@keyframes combat-flash`): opacity pulses 0.2 → 0.65, duration 0.8s, ease-in-out, infinite loop. SVG `<polygon>` with `pointerEvents: "none"`.

#### G.3) Active Focal Point Overlay

| Element | Current State | Needed |
|---------|---------------|--------|
| **Hex overlay** | Fill `#fbbf24` (gold), opacity 0.25 | Animated glow, pulsing |
| **Star (active)** | 5-pointed SVG star, R=0.28×hex, r=0.12×hex, gold fill, amber stroke | Rotation? Glow? Sparkle? |
| **Circle (passive)** | SVG circle, r=0.18×hex, purple fill `#7c3aed` | Softer indication, maybe dashed border |

#### G.4) Die Movement Animation (MovingDie)

| Property | Current State | Needed |
|----------|---------------|--------|
| **Duration** | 260ms (`MOVE_ANIMATION_MS`) | OK — fast and smooth |
| **Easing** | Cubic ease-in-out (custom) | OK |
| **Visual** | Entire die stack flies from source to target | Shadow under flying die? Trail? |
| **Source hex** | Stack suppressed (empty) during animation | OK |

#### G.5) Cursor and Interaction

| State | Cursor | Trigger |
|-------|--------|---------|
| **Clickable hex** | `pointer` | Hex is in `clickableHexes` |
| **Non-clickable hex** | `default` | No `onClick` handler |
| **Hover over hex** | No visual change on polygon | ❗ Missing — add subtle hover effect |

#### G.6) What's Missing / Improvements Needed

| Problem | Description | Proposed Solution |
|---------|-------------|-------------------|
| **Highlight overrides texture** | When highlighted, grass/focus texture disappears → field looks "flat" | Tinted overlay instead of fill replacement — texture shows through |
| **No hover effect** | Mouse over hex has no visual feedback | Subtle edge glow or brightening |
| **No selected trajectory** | Player can't distinguish the chosen path | Dotted line / arrows along path |
| **Static reachable fields** | Static green fill | Animated border or gentle opacity pulsing |
| **Static enemy warning** | Static pink fill | Flashing border, sword / threat icon |
| **Combat flash too subtle** | Only opacity pulsing | Particle effect, sparks, wave |
| **Score pop** | `@keyframes score-pop` scale 1→1.55→1 | OK, maybe add glow/color |

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
| **Map thumbnail** | ⚠️ TEXT PLACEHOLDER "MAP PREVIEW" | Map preview image (JPG/PNG) |
| **Cards** | Stone-800 box | Thematic cards with frame |

#### Map Selection Screen Layout

```
┌────────────────────────────────────────────────────────────┐
│  MAP LIST (left panel)    │     MAP DETAIL (right area)        │
│──────────────────────────│                                    │
│  [← Back]                 │  Map preview (JPG)                 │
│                          │  ┌──────────────────────────────┐ │
│  ┌──────────────────────┐ │  │                              │ │
│  │ [thumb] Classic     │ │  │       (map image)            │ │
│  │ 2 players • 5 VP    │ │  │                              │ │
│  └──────────────────────┘ │  └──────────────────────────────┘ │
│  ┌──────────────────────┐ │                                    │
│  │ [thumb] Fortress   │ │  Name: Classic                     │
│  │ 2 players • 7 VP    │ │  Players: 2 (configure below)      │
│  └──────────────────────┘ │  Victory: First to 5 VP            │
│  ┌──────────────────────┐ │  Fields: 61 hexes                   │
│  │ [thumb] More...    │ │                                    │
│  │ 3 players • 5 VP    │ │  Player setup:                     │
│  └──────────────────────┘ │  ┌──────────────────────────────┐ │
│                          │  │ 🔴 Player 1 [Human ▼] [crest] │ │
│                          │  │ 🔵 Player 2 [AI   ▼] [crest] │ │
│                          │  └──────────────────────────────┘ │
│                          │                                    │
│                          │         [ PLAY ]                    │
└──────────────────────────┴────────────────────────────────────┘
```

#### Map Card

Each card in the list shows:
- **Mini preview** — small JPG/PNG map image
- **Map name** — e.g. "Classic", "Fortress"
- **Player count** — "2 players"
- **VP to win** — "5 VP"
- **Difficulty** — stars or label (easy / medium / hard)
- **Tags** — e.g. "balanced", "asymmetric", "large", "custom"

#### Map Detail (right area)

After clicking a card, the right side shows:
- **Large map preview** — JPG/PNG image of the full map
- **Name** — large heading
- **Map description** — short text (theme, strategy, tip — e.g. "Symmetric classic for beginners")
- **Difficulty** — stars or label
- **Player count** — info
- **Win conditions** — e.g. "First to 5 VP"
- **Size** — number of hexes
- **Number of focal points** — e.g. "3 focal"
- **Tags / categories** — "balanced", "asymmetric", "large", "custom"
- **Player setup** — for each slot:
  - Player color (🔴/🔵)
  - **Human / AI** toggle (dropdown)
  - **Coat of arms** selection (crest icon)
- **PLAY button** — starts the game with selected settings

#### Map List — Extras

- **Filter / sorting** — filter by player count, size, difficulty; sort A–Z
- **Official vs custom** — separation of built-in and user-created maps (tabs or sections)

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
