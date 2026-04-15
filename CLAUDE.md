# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

## Project Overview

**Donjon Fall** ("Pád Donjonu") is a two-player hex-grid board game being rebuilt as a React web app.

- `g-drive/` — original prototype files and the authoritative rules PDF (`PÁD DONJONU – Pravidla_v41.pdf`, rules v4.1). Disregard anything else in this directory, unless specified in prompt.
- `src/` — new React + Vite + Tailwind v4 app, currently just a placeholder (`App.jsx` renders the title).

## Game Rules (v4.2)

### Board & Components

- **61 hexagonal fields** arranged in a large hexagon shape. This is a default map, more can be designed later.
- Two players: **red** and **blue**.
- Each player gets **5 D6 dice** representing their units, plus one shared extra D6 for focal point resolution.
- **Red base** = top row of fields; **Blue base** = bottom row. Bases have no special in-game rules — they act as normal fields.
- **3 focal points** in the middle horizontal row (left, center, right). The center focal point starts as **active** (with 1 victory point on it).

### Win Condition

* First player to accumulate **5 victory points** wins. Points are **permanent** (cannot be lost). Points are only scored on your own turn.
* Player who cannot make a legal turn **immediately loses** the game (sudden death).

### Scoring

- **Destruction**: +1 point per enemy die destroyed (pushed off map, encircled, or tower collapse).
- **Focal points**: If your die held an **active** focal point at the end of your previous turn, at the start of your current turn you: get 1 point, reroll that die (new value = min(roll, original−1), so it can only decrease), then roll the extra D6 to determine which of the two remaining focal points also scores a point (even = left, odd = right).

### Turn Structure (4 phases, in order)

1. **Focal points** — see **Scoring**-**Focal points**.
2. **Actions** — choose and perform **exactly one** of the 4 actions (see below).
3. **Combat** — if your move ended on an enemy-occupied field, resolve combat (phases 1 & 2).
4. **Victory** — if you have 5+ points, you win.

### Actions

* **Move die** — move one of your dice up to its face value in hexes along any path (direction may change mid-move). 
  - Cannot pass through enemy dice. 
  - Can pass through your own dice only if your die has higher combat power on that field. Passing through a friendly die is treated as forming a temporary tower at that point: the remaining movement continues as if jumping off that tower — combat power is boosted to the virtual tower's combat value for the next (own dice − enemy dice, min 1) hexes, then reverts to the die's plain face value. No extra movement is granted; steps already taken count against the die's face value.
  - Moving onto an empty field just moves there.
  - Moving onto a friendly occupied field forms a tower, only if the moving die's combat power exceeds the tower's combat power on that field.
  - Moving onto an enemy field triggers either **Combat** or makes a **tower** (current player's choice). 
  - **Jump from tower**: a die on top of a tower may detach and jump up to its own face value in hexes (same as a standalone die). Its combat power equals the former tower's combat power for the first (own dice in tower − enemy dice in tower, min 1) hexes of the jump; beyond that distance, combat power reverts to the die's plain face value.
* **Tower collapse** — available when the tower has **3+ dice**.
  - Only the player whose die is on **top** can trigger it. 
  - The **bottom** die is removed from the game. If it was an enemy die, you score 1 point.
* **Move whole tower** — the player with the top die controls the tower. 
  - Range = own dice in tower − enemy dice in tower (min 1). 
  - If destination has an enemy, triggers **Combat**; both **push** and **occupy** are available.
* **Reroll** — choose one of your dice (standalone or tower top) and reroll it. 
  - If the new value is lower than the original, keep the original. 
  - Die value can only stay the same or increase.

### Combat

Triggered when a move ends on an enemy-occupied field.

- **Combat power** = top die value + supporting own dice count − enemy dice count. For a standalone die, combat power equals its face value. For a tower, "supporting own dice" excludes the top die itself.
- Attack succeeds only if attacker's combat power **strictly exceeds** the defender's combat power.
- Cannot attack a field where the enemy has equal or higher combat power.

**Phase 1 — Automatic consequences:** Attacker's die value decreases by 1. 
  - A die with combat power 1 cannot attack, so the minimum value a die can drop to from combat is 1.

**Phase 2 — Attacker chooses one option:**
  - **Push** (free retreat path must exist): 
    - The enemy die or the entire enemy formation (see the **Chain reaction**) in the attack direction is pushed 1 hex further, if there is a free field there (free retreat path). 
    - One defeated enemy die **rerolls** (new value = min(roll, original) — defender cannot become stronger). 
    - Mixed tower moves as a whole. 
    - Chain reaction: if another enemy formation is behind, each is pushed in turn; any formation that hits your own unit (see **Encirclement**) or the map edge (see **Off the map**) is **destroyed** (attacker scores points).
    - **Encirclement**: if your own unit blocks the retreat path, the pushed formation (last in the formation in the attack direction) cannot escape and is destroyed (one point per destroyed enemy die).
    - **Off the map**: pushed off the edge → destroyed, attacking player scores 1 point per enemy die destroyed.
  - **Occupy**: attacker's formation is placed on top of the enemy formation, creating a **Mixed tower**. If the attacker was a single die, only that die moves; if the attacker moved as a whole tower, the entire tower moves onto the defender. Control belongs to the player whose die is on top. Defender does **not** reroll.

### Towers & Key Terms

- **Tower**: 2+ dice on the same field. A new die can only be added if its **combat power** strictly exceeds the current tower's combat power. Control = player with top die.
- **Mixed tower**: tower containing both players' dice. Controlled by the player with the top die — only that player can move it, attack from it, or jump from it.
- **Base**: starting row; no special rules during play.

## Stack

- React 19, Vite 8, Tailwind CSS v4 (via `@tailwindcss/vite` plugin — no `tailwind.config.js` needed)
- ESLint 9 flat config (`eslint.config.js`)
- No test framework yet
