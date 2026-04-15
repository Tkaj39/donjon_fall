# Bug Tracker

## Format

| ID | Component | Description | Priority | Status | Resolution |
|----|-----------|-------------|----------|--------|------------|
| — | — | — | — | — | — |

**Priority:** `P1` critical · `P2` high · `P3` medium · `P4` low  
**Status:** `open` · `in-progress` · `resolved` · `wont-fix`

---

## Open Bugs

| ID | Component | Description                                                                                                                                                                                | Priority | Status | Resolution |
|----|-----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|--------|------------|
| BUG-001 | Game / PlayerHUD | Shields display on wrong sides — red player's score shown on blue shield                                                                                                                   | P2 | resolved | Could not reproduce — code correctly keys shield image, score, and active state by playerId |
| BUG-002 | Game / PlayerHUD | Active player indicator and score accumulation are inverted — when red plays, blue shield is highlighted as active and blue receives the points; blue player wins with red player's points | P1 | resolved | Could not reproduce — active player indicator and score accumulation correctly tied to current player |
| BUG-003 | game / combat | Player can initiate attack on an enemy die or tower with equal or higher attack strength — attack should only be allowed when attacker's strength strictly exceeds defender's strength     | P1 | resolved | canAttack guard added in moveDie, jumpDie, and moveTower; illegal attack destinations filtered from reachable hexes in the UI |
| BUG-004 | Board / FocalPointMarker | Active focal point indicator is hidden when a die occupies the focal point field — the active focal point marker should always be visible on top of any die                                | P2 | resolved | Active focal point is recognisable via yellow field highlighting — star visibility not required |
| BUG-005 | game / combat | After choosing Push, the attacking die does not advance to the field it attacked — the attacker should move onto the vacated field after pushing the enemy                                 | P1 | resolved | Attacker stack now moves from attackerHex to defenderHex in applyPush after the push is applied |
| BUG-006 | hex / boardDefinition | Side focal points are placed too close to center — they should each be 2 fields away from the center focal point along the middle row                                                      | P2 | resolved | Side focal points corrected to 3 fields from center; boardConstants.js refactored to use FOCAL_POINT_HEXES as single source of truth |
| BUG-007 | game / victory | Victory is checked only at end of turn — game should end immediately when any player reaches 5 points (e.g. mid-turn after scoring from destruction or focal points)                       | P1 | resolved | Added victory check in advancePhase for the focal case — if player reaches 5 VP from focal scoring, phase transitions immediately to victory instead of action |
| BUG-008 | game / movement | Moving a tower you control is incorrectly evaluated as combat when your own die occupies the destination field — moving a controlled tower onto a friendly die should not trigger combat   | P1 | resolved | applyMoveTowerAction now handles friendly destination separately: stacks the tower if top die's combat power exceeds the target's, without triggering combat |
| BUG-009 | game / combat | Computed attack strength is possibly off by +1 for both attacker and defender — own dice count should not include the attacking die itself                                                 | P2 | resolved | getAttackStrength corrected to exclude the top die from own dice count; canEnterTower updated to use standalone face value for the moving die |
| BUG-010 | game / combat | Illegal combat directions are shown and selectable — a direction should only be offered if the attacker can actually reach the defender's field within its remaining movement radius     | P2 | resolved | getApproachDirections now accepts an actionType parameter; tower moves use getTowerPathsToHex (tower range + empty-only intermediates) instead of the single-die getPathsToHex |
| BUG-011 | Game / PlayerHUD | Current player turn highlight sometimes displays on the wrong side of the map — reliably reproducible when navigating through player/map settings instead of using the Direct Play feature | P2 | open | — |

---

## Resolved Bugs

| ID | Component | Description | Priority | Status | Resolution |
|----|-----------|-------------|----------|--------|------------|
| — | — | — | — | — | — |
