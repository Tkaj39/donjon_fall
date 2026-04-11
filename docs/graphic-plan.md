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

> Dice are the most important visual game units — the player interacts with them every turn.
> Two visual modes: **2D with 3D effect** (default, lighter) and **full 3D** (optional, more demanding).

#### B.1) Current State

| Element | Value | Detail |
|---------|-------|--------|
| **Shape** | SVG `<rect>` with rounded corners (`rx = 0.3 × half`) | Square, side = `hexSize × 0.55` (≈ 21 px) |
| **Body color** | `primary` from `PLAYER_PALETTE` | Red `#dc2626`, blue `#2563eb` |
| **Stroke** | `rgba(0,0,0,0.35)`, width 1 px | Same for all players |
| **Pips** | White SVG `<circle>`, opacity 0.9, r = `hexSize × 0.075` | Classic layout 1–6 |
| **Non-top opacity** | 0.55 | Dimmed dice below tower top |
| **Stacking offset** | `hexSize × 0.22` per level | Vertical shift in tower |
| **"Selected" visual state** | None — only hex color changes | Missing die highlight |
| **Shadow / 3D** | None | Flat appearance |
| **Animation** | None on die itself | Only MovingDie (flight between hexes, 260ms) |

#### B.2) Variant 1 — 2D with 3D Effect (default)

Light visual upgrade keeping SVG `<rect>` base, suitable for low performance and mobile devices.

```
  ┌─────────────┐
  │ ╔═══════╗   │  ← outer shadow (drop shadow)
  │ ║ ● · ● ║   │  ← die body with gradient
  │ ║ · ● · ║   │     (light → dark top to bottom)
  │ ║ ● · ● ║   │
  │ ╚═══════╝   │  ← bottom edge (darker line)
  └─────────────┘
```

| Element | Proposal | Detail |
|---------|----------|--------|
| **Body** | SVG `<rect>` + linear gradient (lighter top → darker bottom) | Simulates top-down lighting |
| **Top edge** | Thin light line (1 px, white 20 %) | Light reflection |
| **Bottom/right edge** | Darker line (1 px, black 25 %) | Depth |
| **Drop shadow** | SVG `<filter>` — `feDropShadow`, dx=1, dy=2, blur=2 | Die "sits" on the board |
| **Pips** | Inner shadow (inset effect) — darker shadow around pip | Relief / carved look |
| **Shine** | Small white radial gradient in top-left corner (opacity 0.15) | Plastic/glass effect |
| **Selected die** | Gold outline (2 px, `#f59e0b`) + subtle glow | New state |
| **Hover** | Slight scale-up (`transform: scale(1.08)`) + brightening | New state |
| **Reroll animation** | CSS `@keyframes` — rapid pip layout switching (0.3s) | Visual "flip" |
| **Tower stacking** | Shadow gradient on lower dice — darker = lower | Better depth |

#### B.3) Variant 2 — Full 3D Dice

Isometric appearance with three visible faces. More demanding on rendering, suitable as optional "premium" setting.

```
       ╱─────╲
      ╱  ● ●  ╲        ← top face (current value)
     ╱  ●   ●  ╲
    ╱─────────────╲
    │  ·       ·  │╲
    │  ·   ·   ·  │ ╲   ← right side face (decorative)
    │  ·       ·  │  │
    └─────────────┘  │
       ╲──────────╱  │  ← bottom edge
        ╲─────────╱
```

| Element | Proposal | Detail |
|---------|----------|--------|
| **Top face** | SVG `<polygon>` — rhombus (isometric projection) | Shows current value (pips) |
| **Left face** | SVG `<polygon>` — trapezoid, darker shade of player color | Decorative — no pips or fixed pattern |
| **Right face** | SVG `<polygon>` — trapezoid, medium-dark shade | Decorative — no pips or fixed pattern |
| **Lighting** | Top = 100 %, left = 65 %, right = 80 % brightness | Consistent top-left light source |
| **Pips on top face** | Isometrically transformed positions | Ovals instead of circles (perspective) |
| **Shadow under die** | SVG ellipse, blurred, black 15 % | Die "stands" on hex |
| **Selected die** | Glow around all three faces (outer glow, gold) | Consistent with 2D variant |
| **Hover** | Slight "lift" effect — shift up 2 px + larger shadow | As if hovering |
| **Reroll animation** | Rotation around vertical axis (CSS 3D transform, 0.4s) | Die "flips" |
| **Tower stacking** | Isometric layering — each die higher and slightly back | Realistic tower |
| **Dimensions** | Total height ≈ `hexSize × 0.7`, width ≈ `hexSize × 0.55` | Larger than 2D due to side faces |

#### B.4) Common Elements (both variants)

| Element | Proposal | Detail |
|---------|----------|--------|
| **Player colors** | Keep `PLAYER_PALETTE.primary` | Red, blue (+ green, amber, purple, cyan for future players) |
| **Pip color** | White with subtle shadow | Consistent visibility on dark and light bodies |
| **Non-top opacity** | Reduce from 0.55 → 0.45 + desaturation | Clearer top vs lower distinction |
| **Selected die** | NEW STATE — gold outline + glow | Currently missing |
| **Hover die** | NEW STATE — scale-up + brightening | Currently missing |
| **Variant switching** | Settings → Graphics style → "2D" / "3D" | Player selects in menu |
| **Number as fallback** | SVG `<text>` with number instead of pips for low resolution / accessibility | Optional in accessibility settings |

#### B.5) What's Missing / Improvements Needed

| Problem | Description | Proposed Solution |
|---------|-------------|-------------------|
| **No "selected die" state** | Player can't see which die is selected — only hex changes | Gold outline + glow on die |
| **No hover effect** | Hovering over die has no visual feedback | Scale + brightening |
| **Flat appearance** | No shadow, gradient, or depth | Gradient + drop shadow (2D) or 3 faces (3D) |
| **Monotone pips** | White circles without effect | Relief / inset shadow |
| **Reroll without visual** | Value changes "instantly" | Flip / rotation animation |
| **Tower looks flat** | Only opacity distinguishes levels | Shadow gradient + isometric layering |

### C) Action Panel (ActionPanel)

> Panel with 4 action buttons at the bottom of the screen. Visible only when player selects a hex with their own die.

#### C.1) Current State

| Element | Value | Detail |
|---------|-------|--------|
| **Layout** | Horizontal `flex gap-2` | Bottom-center, inside `pb-4 px-4` |
| **Container** | `bg-[#1e293b]`, border `#475569`, `rounded-xl` | Dark card with subtle border |
| **Shadow** | `0 4px 16px rgba(0,0,0,0.4)` | Mild drop shadow |
| **Visibility** | `visibility: hidden/visible` | Stays in layout even when hidden |
| **Show condition** | `phase === "action"` + selected hex + action not taken | — |

#### C.2) Action Buttons

| Action | Label | Visibility |
|--------|-------|------------|
| **Move tower** | `"Move tower"` | Only when selected hex is a tower with reachable fields |
| **Move die** | `"Move die"` | When die has reachable fields |
| **Reroll** | `"Reroll"` | Always |
| **Collapse** | `"Collapse"` | Only tower 3+ dice with own on top |

**Button states:**

| State | Border | Background | Text Color | Font |
|-------|--------|------------|------------|------|
| **Active** | `2px solid #f59e0b` | `rgba(245,158,11,0.18)` | `#f59e0b` (amber) | 700 |
| **Enabled** | `2px solid transparent` | `rgba(255,255,255,0.08)` | `#f1f5f9` (light) | 500 |
| **Disabled** | `2px solid transparent` | `rgba(255,255,255,0.04)` | `rgba(255,255,255,0.25)` | 500 |

Transitions: `background 0.12s, border-color 0.12s, color 0.12s`.

#### C.3) Graphic Proposal

| Element | Proposal | Detail |
|---------|----------|--------|
| **Container** | Thematic frame — wooden/stone board | Instead of generic slate panel |
| **Buttons** | Icon + text (sword for move, arrows for shift, die for reroll, collapse for demolish) | Currently text only |
| **Hover effect** | Brightening + subtle scale(1.05) | Currently no hover |
| **Active state** | Thematic glow / inset (pressed effect) | More prominent than just amber border |
| **Disabled state** | Gray + strikethrough or lock icon | Clear "cannot use" |
| **Selection animation** | Short pulse/bounce on click (0.15s) | Currently none |
| **Tooltips** | Tooltip on hover explaining the action | Currently none |
| **Keyboard shortcuts** | Visual shortcut indicator on button (1–4) | For future keyboard controls |

### D) Score and Player Shields (PlayerShield)

> Two shields on either side of the board — crest, name, VP score, active player indicator.

#### D.1) Current State

| Element | Value | Detail |
|---------|-------|--------|
| **Shield size** | `w-28 h-28` (112×112 px) | Container for shield + animal |
| **Shield image** | `shield-[color].png` (6 colors) | Layer 1 — background |
| **Animal image** | `animal-[type].png` (6 animals: bear, deer, horse, pig, rooster, wolf) | Layer 2 — overlay with `p-1` |
| **Name** | `text-xs font-semibold`, `max-w-28 truncate` | Fallback to player ID |
| **VP badge (active)** | `bg-amber-400 text-stone-900` | Circle below shield |
| **VP badge (inactive)** | `bg-stone-700 text-stone-200` | Gray circle |
| **Badge position** | `absolute -bottom-1 left-1/2 -translate-x-1/2` | Centered below shield |
| **Layout** | `flex flex-col items-center gap-1 shrink-0` | Vertical: shield → name |

#### D.2) Graphic Proposal

| Element | Proposal | Detail |
|---------|----------|--------|
| **Shield quality** | Final artworks — consistent style (heraldic, hand-painted?) | 6 colors: red, blue, green, amber, purple, cyan |
| **Animal quality** | Unify style — all animals in same technique | Currently mixed styles/quality |
| **Larger name** | `text-sm` or `text-base`, better font | `text-xs` is too small |
| **VP badge redesign** | Heraldic medallion / shield badge instead of circle | Gold for active, silver/bronze for inactive |
| **Active player** | Animated border around entire shield (glow, pulsing) | Badge alone is insufficient |
| **Score-pop animation** | Keep `scale 1→1.55→1` + add color/glow | Existing `@keyframes score-pop` |
| **Hover on shield** | Subtle scale-up + tooltip with player details | Currently no interaction |
| **Turn transition** | Smooth badge color animation (0.3s) | Currently instant switch |
| **Destroyed dice** | Indicator of how many dice the player lost (mini dice / number) | Completely missing |
| **Dice on map count** | Mini overview "3/5 dice" below VP | Completely missing |

---

## PRIORITY 2 — Combat and Interaction

### E) Combat (CombatOverlay)

> Modal dialog over the game board showing attacker/defender strengths with Push/Occupy choice.

#### E.1) Current State

| Element | Value | Detail |
|---------|-------|--------|
| **Position** | `absolute top-1/2 left-1/2 -translate-x/y-1/2` | Centered over the board |
| **Z-index** | `z-[100]` | Above everything except full-screen modals |
| **Container** | `bg-[#1e293b]`, border `#475569`, `rounded-xl` | Same style as ActionPanel |
| **Size** | `min-w-56` (224 px), `py-5 px-6` | Compact card |
| **Shadow** | `0 8px 32px rgba(0,0,0,0.5)` | Prominent drop shadow |
| **Title** | `"Combat"`, `1.1rem bold` | Simple text |
| **Attacker strength** | `text-2xl font-bold` | Number + label "Attacker" |
| **Defender strength** | `text-2xl font-bold` | Number + label "Defender" |
| **Separator** | `"vs"`, `opacity-50` | Between columns |
| **Buttons** | Push / Occupy (only available ones shown) | `bg-[#334155]`, border `#475569` |
| **Animation** | None on overlay | Only combat-flash on hexes behind it |

#### E.2) Graphic Proposal

```
┌─────────────────────────────┐
│         ⚔ COMBAT ⚔         │
│                             │
│    ⚔ ATTACKER   🛡 DEFENDER │
│       ┌───┐        ┌───┐   │
│       │ 5 │  vs.   │ 3 │   │
│       └───┘        └───┘   │
│     [die icon]  [die icon]  │
│                             │
│   [ 🗡 Push ]  [ 🏰 Occupy ] │
└─────────────────────────────┘
```

| Element | Proposal | Detail |
|---------|----------|--------|
| **Frame** | Thematic — parchment, stone tablet, or wooden frame | Instead of generic slate |
| **Title** | Sword icon ⚔ + decorative font | More dramatic |
| **Strength — visualization** | Mini die with value instead of just numbers | Colored die for attacker/defender |
| **Strength — breakdown** | Show formula: "top die (4) + own (2) − enemy (1) = 5" | Player sees how strength is calculated |
| **VS separator** | Crossed swords icon instead of "vs" text | Graphical separation |
| **Push button** | Arrow/strike icon + text + tooltip | Explanation of what happens |
| **Occupy button** | Tower/fortification icon + text + tooltip | Explanation of what happens |
| **Button hover** | Brightening + preview effect on board | Player sees action impact |
| **Enter animation** | Slide-in + fade (0.2s ease-out) | Currently appears instantly |
| **Exit animation** | Fade-out (0.15s) | Disappears smoothly after choice |
| **Sound effect** | Clash/strike sound on open | For future audio |
| **Info panel** | What happens after Push vs Occupy — short tooltip | Beginners may not know the difference |

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

> Form for entering player names and selecting coat of arms. Shown after map selection (or standalone for "Quick Start").

#### I.1) Current State

```
┌─────────────────────────────────────────┐
│  ← Back                                │
│                                         │
│        [Logo w-20 h-20]                 │
│                                         │
│        PLAYER SETUP                     │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🔴 Red                         │   │
│  │ Player name: [____________]     │   │
│  │ Coat of arms:                   │   │
│  │ [🐻][🦌][🐴][🐷][🐓][🐺]     │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ 🔵 Blue                        │   │
│  │ Player name: [____________]     │   │
│  │ Coat of arms:                   │   │
│  │ [🐻][🦌][🐴][🐷][🐓][🐺]     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [       CONFIRM       ]                │
└─────────────────────────────────────────┘
```

| Element | Value | Detail |
|---------|-------|--------|
| **Background** | `bg-stone-900/60 text-white p-8` | Semi-transparent dark |
| **Container** | `max-w-lg` (~512 px) | Centered column |
| **Logo** | `<Logo className="w-20 h-20" />` | Centered, `mb-4` |
| **Heading** | `text-2xl font-bold tracking-wide uppercase mb-6` | Text: "Player Setup" |
| **Slot card** | `bg-stone-800 border border-stone-600 rounded-xl p-5` | One card per player |
| **Color dot** | `w-5 h-5 rounded-full bg-red-700 / bg-blue-700` | Player identification |
| **Color label** | `text-stone-300 text-sm font-semibold uppercase tracking-wide` | "Red" / "Blue" |
| **Name input** | `bg-stone-700 border-stone-600 rounded-lg px-3 py-2 text-sm` | `maxLength={24}`, placeholder "Enter name…" |
| **Focus input** | `focus:border-stone-400` | Border change only |
| **CoA grid** | `flex flex-wrap gap-2` | 6 tiles in a row |
| **CoA tile** | `w-14 h-14 rounded-lg border-2 overflow-hidden` | Shield PNG + animal PNG |
| **CoA selected** | `border-white ring-2 ring-white` | White outline + ring |
| **CoA unselected** | `border-stone-600 hover:border-stone-400` | Gray outline |
| **Back button** | `text-stone-400 hover:text-white text-sm` | "← Back" |
| **Confirm button** | `bg-red-700 hover:bg-red-600 disabled:bg-stone-700` | `disabled` if name missing |
| **Animation** | `transition-colors` on buttons | No other animations |

#### I.2) Graphic Proposal

```
┌─────────────────────────────────────────┐
│  ⬅ Back                                │
│        [Logo]                           │
│   ══ PLAYER SETUP ══                   │
│                                         │
│  ╔═══════════════════════════════════╗   │
│  ║  🔴 RED                           ║   │
│  ║  ┌─[parchment input]───────────┐ ║   │
│  ║  │  Name: Elizabeth             │ ║   │
│  ║  └──────────────────────────────┘ ║   │
│  ║  Crest:                           ║   │
│  ║  ╔════╗ ┌────┐ ┌────┐ ┌────┐    ║   │
│  ║  ║ 🐻 ║ │ 🦌 │ │ 🐴 │ │ 🐷 │    ║   │
│  ║  ╚════╝ └────┘ └────┘ └────┘    ║   │
│  ║  (selected)                       ║   │
│  ╚═══════════════════════════════════╝   │
│                                         │
│  ╔═══════════════════════════════════╗   │
│  ║  🔵 BLUE                          ║   │
│  ║  ...                              ║   │
│  ╚═══════════════════════════════════╝   │
│                                         │
│  [  ⚔  CONFIRM & PLAY  ⚔  ]            │
└─────────────────────────────────────────┘
```

| Element | Proposal | Detail |
|---------|----------|--------|
| **Background** | Illustration / dark artwork instead of `stone-900/60` | Consistent with MainMenu |
| **Slot card** | Parchment / leather frame with relief | Instead of generic `stone-800` |
| **Color dot** | Heraldic badge / ribbon with player color | Instead of bare circle |
| **Name input** | Parchment style — warm tone, calligraphic font | Instead of `stone-700` rectangle |
| **Focus input** | Golden outline + subtle glow | Instead of just `border-stone-400` |
| **CoA tile — larger** | `w-20 h-20` instead of `w-14 h-14` | Better recognizability |
| **CoA selected** | Golden outline + pulsing glow + "inset" effect | More prominent than just white ring |
| **CoA hover** | Scale `scale(1.08)` + subtle shadow | Currently just border change |
| **CoA selection animation** | Bounce / pop effect (0.2s) | Missing |
| **CoA preview** | Below grid show large selected crest (~128×128 px) | Missing — player can't see detail |
| **Confirm button** | Thematic — stone / metal style, sword icons | Instead of generic `bg-red-700` |
| **Confirm disabled** | Grayed + tooltip "Enter both player names" | Currently just grayed out |
| **Back button** | Arrow in thematic style | Consistent with other screens |
| **Validation** | Red glow around empty input on confirm attempt | Missing |
| **Sound effect** | Click on crest selection, fanfare on confirm | For future audio |

#### I.3) Missing / To Improve

| Problem | Description | Proposed Solution |
|---------|-------------|-------------------|
| **Small CoA tiles** | 56×56 px — hard to see detail | Enlarge to 80×80+ px |
| **No CoA preview** | Player can't see selected crest enlarged | Large preview (128×128) below grid |
| **No validation** | Empty name → button just disabled, no explanation | Tooltip + input highlight |
| **No hover on CoA** | Just border change | Scale + shadow + tooltip with name |
| **No selection animation** | Instant switch | Bounce/pop effect |
| **Generic look** | Stone panels, no theming | Parchment, leather, relief |
| **Missing Human/AI toggle** | Can't set AI opponent | Dropdown in player card |
| **Missing color selection** | Colors fixed to red/blue | Dropdown/palette selector (6 colors) |

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

> Two transitional screens — GameLoading (game preparation) and VictoryScreen (game end).

#### K.1) GameLoading — Current State

```
┌────────────────────────────────────────────────────────────┐
│                     [Logo] (fixed top)                      │
│                                                            │
│  ┌──────────┐                              ┌──────────┐   │
│  │ [shield] │        Get ready…            │ [shield] │   │
│  │ [animal] │      ┌──────────┐            │ [animal] │   │
│  │ Name     │      │ ◠  spin  │            │ Name     │   │
│  │ Red      │      │          │            │ Blue     │   │
│  │          │      └──────────┘            │          │   │
│  └──────────┘                              └──────────┘   │
└────────────────────────────────────────────────────────────┘
```

| Element | Value | Detail |
|---------|-------|--------|
| **Background** | `bg-stone-900/60 text-white p-8` | Semi-transparent dark |
| **Layout** | `flex items-center justify-around min-h-screen` | Players on sides, spinner in center |
| **Logo** | `fixed top-16 left-1/2 -translate-x-1/2` | Fixed position top, centered |
| **Text** | `text-stone-400 text-sm uppercase tracking-widest` | "Get ready…" |
| **Spinner** | `w-32 h-32 rounded-full border-4 border-stone-400 border-t-transparent animate-spin` | 128×128 px, CSS rotation |
| **Player card** | `flex items-center gap-4` | Shield + animal (16×16 px) + name + color |
| **Shield** | `w-16 h-16 rounded-xl overflow-hidden` | Smaller than game board (w-28) |
| **Preloading** | `preloadImages(GAME_ASSETS)` — 5 images | grass, grass-dense, focus, startr-field-red, startr-field-blue |
| **Min duration** | `LOADING_DURATION_MS = 1800` (1.8s) | Minimum display even on fast load |
| **Animation** | Only `animate-spin` on spinner | No other effects |

#### K.2) GameLoading — Graphic Proposal

| Element | Proposal | Detail |
|---------|----------|--------|
| **Background** | Atmospheric artwork — fog, ramparts, landscape | Instead of `stone-900/60` |
| **Spinner** | Thematic loading — falling dice, rotating crest, sword | Instead of generic border-spin circle |
| **Progress bar** | Horizontal progress below spinner (% loaded) | Missing — player doesn't know how much remains |
| **Text** | Rotating tips / game rules during wait | "Did you know? A tower with 3+ dice can collapse…" |
| **Entrance animation** | Fade-in player cards from sides (0.3s) | Currently everything appears at once |
| **Player cards** | Larger crests + heraldic frames | Consistent style with PlayerSetup |
| **VS in center** | Large "VS" or crossed swords between players | Dramatic entrance |
| **Sound effect** | Drumroll, tension, preparation sound | For future audio |
| **Exit animation** | Smooth transition to game screen (fade/slide) | Currently instant switch |

#### K.3) VictoryScreen — Current State

| Element | Value | Detail |
|---------|-------|--------|
| **Overlay** | `fixed inset-0 bg-[rgba(0,0,0,0.82)] z-[200]` | Full-screen modal |
| **Layout** | `flex flex-col items-center justify-center gap-6` | Centered vertical column |
| **Logo** | `<Logo className="w-20 h-20" />` | Top |
| **Trophy SVG** | 72×72 px: `<circle>` (r=36, opacity 0.15) + `<polygon>` crown + `<rect>` pedestal | Winner's color |
| **Crown polygon** | `points="14,50 20,28 36,40 52,28 58,50"` | 5-point crown shape |
| **Pedestal** | `<rect x="14" y="50" width="44" height="6" rx="3" />` | Rounded rectangle |
| **Heading** | `text-[2.2rem] font-extrabold text-[#f1f5f9]` | "Victory!" |
| **Winner label** | `text-[1.2rem] font-semibold capitalize` + `style={{ color }}` | "{winner} wins" |
| **Colors** | Red: `#ef4444`, Blue: `#3b82f6`, Fallback: `#94a3b8` | Dynamic color |
| **Button** | `py-[0.65rem] px-8 rounded-[0.6rem]` + `style={{ background: color }}` | "New game" |
| **Button shadow** | `boxShadow: "0 4px 20px ${color}55"` | Colored glow |
| **Hover** | Inline `opacity: 0.85` via `onMouseEnter/Leave` | Simple dimming |
| **Animation** | No entrance/exit animation | Everything appears instantly |
| **Accessibility** | `role="dialog" aria-modal="true"` | OK |

#### K.4) VictoryScreen — Graphic Proposal

```
┌────────────────────────────────────────────┐
│                                            │
│               [Logo]                       │
│                                            │
│         ★  ★  ★  ★  ★                    │
│            ┌──────┐                        │
│            │ 👑   │  ← animated crown      │
│            │ CROWN│     (gold + glow)      │
│            └──────┘                        │
│         ★  ★  ★  ★  ★                    │
│                                            │
│         V I C T O R Y !                    │
│         ═══════════════                    │
│         Red wins                           │
│                                            │
│   VP: 5  |  Turns: 23  |  Destroyed: 3    │
│                                            │
│  [🎮 New Game]   [📊 Statistics]            │
│                                            │
│  ✨ confetti / particles ✨                 │
└────────────────────────────────────────────┘
```

| Element | Proposal | Detail |
|---------|----------|--------|
| **Crown** | More detailed SVG — golden crown with gems | Instead of simple 5-point polygon |
| **Crown animation** | Pulsing glow + rotation / floating | Missing — static |
| **Confetti** | CSS/Canvas particle effect — falling confetti in winner's color | Missing entirely |
| **Stars** | Decorative stars around crown (SVG, rotating) | Festive framing |
| **Heading** | Decorative font + text gradient (gold → white) | More dramatic than plain text |
| **Statistics** | Mini game summary — VP, turn count, destroyed dice | Missing — player doesn't see summary |
| **Buttons** | "New Game" + "Statistics" / "Share" | Currently only "New game" |
| **Entrance animation** | Sequential reveal: overlay fade (0.3s) → crown pop (0.2s) → text slide-up (0.2s) | Currently all at once |
| **Sound effect** | Fanfare, victory sound | For future audio |
| **Backdrop** | Behind crown a large circle / mandala in winner's color | Decorative background |
| **Losing player** | Dimmed crest of the loser in corner | Context — who lost |

---

## PRIORITY 4 — Supplementary

### L) Rules (RulesViewer)

> Modal dialog accessible from the game screen ([?] button). Displays complete rules in collapsible sections.

#### L.1) Current State

| Element | Value | Detail |
|---------|-------|--------|
| **Backdrop** | `fixed inset-0 bg-[rgba(0,0,0,0.75)] z-[300]` | Click-outside closes |
| **Panel** | `bg-[var(--color-panel-bg,#1e293b)]` | `max-w-[36rem]`, `max-h-[85vh]`, `rounded-2xl` |
| **Border** | `border-2 border-[var(--color-panel-border,#475569)]` | CSS variable with fallback |
| **Shadow** | `0 16px 48px rgba(0,0,0,0.6)` | Prominent drop shadow |
| **Heading** | `text-[1.15rem] font-bold text-[#f1f5f9]` | "Game Rules" |
| **Header buttons** | Expand all / Collapse all / ✕ | `bg-white/[0.07] border-white/20 text-xs` |
| **Scrollable body** | `overflow-y-auto px-5 grow` | Sections stacked |
| **Sections (7)** | Board & Components, Win Condition, Scoring, Turn Structure, Actions, Combat, Towers & Key Terms | Collapsible accordion |
| **Section toggle** | `<button>` with `aria-expanded` + chevron `▼` | Rotation 0°↔180° (0.2s) |
| **Section content** | `<ul>` with `<li>` — plain rule text | `text-[0.85rem] leading-[1.65]` |
| **Accessibility** | `role="dialog" aria-modal aria-label` + `aria-expanded/controls` | Good baseline support |
| **Animation** | Only chevron rotation (`transition-transform 200ms`) | No slide/fade on content |

#### L.2) Graphic Proposal

```
┌─────────────────────────────────────┐
│  📜 GAME RULES            [−][+][✕] │
│─────────────────────────────────────│
│                                     │
│  ▼ Board & Components              │
│  ┌─────────────────────────────┐   │
│  │ • 61 hexagonal fields...   │   │
│  │ • Two players: red, blue   │   │
│  │                             │   │
│  │   ┌─────────────────┐      │   │
│  │   │  [board          │      │   │
│  │   │   illustration]  │      │   │
│  │   └─────────────────┘      │   │
│  └─────────────────────────────┘   │
│                                     │
│  ▶ Win Condition (collapsed)        │
│  ▶ Scoring                         │
│  ▶ Turn Structure                  │
│  ▶ Actions                         │
│  ▶ Combat                          │
│  ▶ Towers & Key Terms              │
│                                     │
└─────────────────────────────────────┘
```

| Element | Proposal | Detail |
|---------|----------|--------|
| **Panel frame** | Parchment / scroll style — warm colors, edges | Instead of generic `#1e293b` |
| **Heading** | Scroll icon 📜 + decorative font | More thematic |
| **Illustrations** | Images / diagrams for each rules section | Missing entirely — text only |
| **Board diagram** | Mini hex grid with labels (starting fields, focal points) | Visual aid |
| **Combat diagram** | Arrows for attacker vs defender strength, push/occupy visualization | Combat rules are complex |
| **Tower diagram** | Dice stacking, mixed tower, control | Key concept |
| **Expand animation** | Slide-down + fade-in (0.2s) on section content | Currently content just shows/hides |
| **Search** | Text field for searching within rules | Missing — 7 sections, lots of text |
| **Keywords** | Highlighted key terms (bold, color, tooltip) | "Tower", "Push", "Occupy" as links |
| **TOC** | Navigation sidebar / sticky section headers | For quick section access |
| **Content font** | More readable — `text-[0.9rem]` + larger `leading` | Currently rather small |
| **Header buttons** | Icons instead of text (↕ expand, ↔ collapse, ✕ close) | More compact |
| **Dark/light** | Dark parchment (default) vs light parchment (accessibility) | Toggle in settings |
| **Print** | CSS `@media print` style for printing rules | Nice-to-have |

### M) Favicon

> Browser tab icon — currently `favicon.png` in `/public/`.

#### M.1) Current State

| Element | Value | Detail |
|---------|-------|--------|
| **File** | `public/favicon.png` | PNG format |
| **HTML reference** | `<link rel="icon" type="image/svg+xml" href="/favicon.png">` | `type` mismatch — declares SVG but file is PNG |
| **Size** | Not verified | Likely single size |
| **Usage** | Browser tab | — |

#### M.2) Graphic Proposal

| Element | Proposal | Detail |
|---------|----------|--------|
| **Fix type** | `type="image/png"` or switch to SVG | Current type/file mismatch |
| **Multi-size** | ICO bundle: 16×16, 32×32, 48×48, 64×64 | For different contexts (tab, bookmark, desktop) |
| **SVG variant** | Vector favicon — scales to any size | Modern browsers prefer SVG |
| **Apple touch icon** | `apple-touch-icon.png` (180×180) | For iOS bookmarks |
| **Manifest** | `site.webmanifest` with 192×192 and 512×512 icons | For PWA / mobile install |
| **Motif** | Miniaturized logo or heraldic crest | Recognizable even at 16×16 px |
| **Dark mode** | `<link rel="icon" media="(prefers-color-scheme: dark)">` | Variant for dark browser mode |

---

## Priority Summary

| Priority | Groups | Impact |
|----------|--------|--------|
| **P1** | Board, Dice, Panel, Shields | Game core — player sees constantly |
| **P2** | Combat, Direction, Highlights | Key interactions — must be legible |
| **P3** | Menu, Setup, Loading, Victory | First/last impression — "wow factor" |
| **P4** | Rules, Favicon | Nice-to-have |
