# Feature Tracker

## Format

| ID | Component | Description | Priority | Status | Notes |
|----|-----------|-------------|----------|--------|-------|
| — | — | — | — | — | — |

**Priority:** `P1` critical · `P2` high · `P3` medium · `P4` low  
**Status:** `open` · `in-progress` · `done` · `wont-do`

---

## UX / Controls

| ID | Component | Description | Priority | Status | Notes |
|----|-----------|-------------|----------|--------|-------|
| FEAT-001 | Layout | Smooth responsive transition between mobile and desktop layouts (not just two separate breakpoints) | P2 | open | |
| FEAT-002 | Game / Mobile | Audit mobile playability: is the game fully functional without hover? Identify any info or interactions missing on touch devices | P2 | open | |
| FEAT-003 | Game / Mobile | Attack direction via touch: (1) touch & hold enemy die, (2) swipe through possible attack directions, (3) release on desired direction to confirm attack | P2 | open | |
| FEAT-004 | Game / Desktop | Hex hover: show shortest movement path to hovered hex | P3 | open | |
| FEAT-005 | Game / Desktop | Hex hover: show attack direction indicator when hovering over an attackable enemy | P3 | open | |
| FEAT-006 | Game / Desktop | Audit and eliminate any unnecessary extra clicks in the desktop flow | P3 | open | |

---

## Action Panel

| ID | Component | Description | Priority | Status | Notes |
|----|-----------|-------------|----------|--------|-------|
| FEAT-007 | Game / ActionPanel | Show action buttons immediately (no extra step); hide buttons the active player cannot use — e.g. hide Move Tower and Tower Collapse if they control no towers | P2 | open | |
| FEAT-008 | Game / ActionPanel | On Move action: dim all hexes except those containing the player's dice/towers and their reachable destinations | P3 | open | |
| FEAT-009 | Game / ActionPanel | On Reroll action: dim all hexes except those containing the player's controllable dice/towers | P3 | open | |

---

## Feedback & Animations

| ID | Component | Description | Priority | Status | Notes |
|----|-----------|-------------|----------|--------|-------|
| FEAT-010 | Game / Overlay | Player-change overlay: show whose turn it is when the active player changes | P2 | open | |
| FEAT-011 | Game / Overlay | Reroll overlay: show which die rerolled and from what value to what value | P2 | open | |
| FEAT-012 | Game / Overlay | Focal point overlay: show that a victory point was scored from a focal point | P2 | open | |
| FEAT-013 | Game / Overlay | Combat overlay: show die attrition, rerolls, and any victory points gained | P2 | open | |
| FEAT-014 | Game | Animations for movement, combat, and state transitions | P3 | open | |

---

## Persistence

| ID | Component | Description | Priority | Status | Notes |
|----|-----------|-------------|----------|--------|-------|
| FEAT-015 | App | Persist in-progress game across browser close and page refresh (localStorage or similar) | P2 | open | |

---

## Debug Tooling

| ID | Component | Description | Priority | Status | Notes |
|----|-----------|-------------|----------|--------|-------|
| FEAT-016 | Dev / Debug | Debug overlay: ability to report a bug directly from within the game (capture board state, action, description) | P3 | open | |
| FEAT-017 | Dev / Debug | Undo: ability to step back any number of turns during play (useful for bug reproduction) | P3 | open | |
| FEAT-018 | Dev / Debug | Debug board state recorder: select dice/towers, record their positions, and note which action triggers the bug | P3 | open | |

---

## AI / Dev Workflow

| ID | Component | Description | Priority | Status | Notes |
|----|-----------|-------------|----------|--------|-------|
| FEAT-019 | Dev / AI | Claude should never commit automatically — always ask before committing | P2 | open | Already noted in memory; formalize as a CLAUDE.md rule |
| FEAT-020 | Dev / AI | Load full game rules into Claude's memory so it can reference them directly without reading the PDF | P3 | open | |
| FEAT-021 | Dev / AI | Build a knowledge base of project-specific technology decisions and patterns for Claude to reference | P4 | open | |
| FEAT-022 | Dev / AI | Per-branch session memory: Claude saves and restores context when switching git branches | P4 | open | |

---

## Done

| ID | Component | Description | Priority | Status | Notes |
|----|-----------|-------------|----------|--------|-------|
| — | — | — | — | — | — |