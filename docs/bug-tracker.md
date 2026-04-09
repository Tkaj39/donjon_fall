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
| BUG-003 | game / combat | Player can initiate attack on an enemy die or tower with equal or higher attack strength — attack should only be allowed when attacker's strength strictly exceeds defender's strength     | P1 | open | — |
| BUG-004 | Board / FocalPointMarker | Active focal point indicator is hidden when a die occupies the focal point field — the active focal point marker should always be visible on top of any die                                | P2 | resolved | Active focal point is recognisable via yellow field highlighting — star visibility not required |
| BUG-005 | game / combat | After choosing Push, the attacking die does not advance to the field it attacked — the attacker should move onto the vacated field after pushing the enemy                                 | P1 | open | — |
| BUG-006 | hex / boardDefinition | Side focal points are placed too close to center — they should each be 2 fields away from the center focal point along the middle row                                                      | P2 | open | — |
| BUG-007 | game / victory | Victory is checked only at end of turn — game should end immediately when any player reaches 5 points (e.g. mid-turn after scoring from destruction or focal points)                       | P1 | open | — |
| BUG-008 | game / movement | Moving a tower you control is incorrectly evaluated as combat when your own die occupies the destination field — moving a controlled tower onto a friendly die should not trigger combat   | P1 | open | — |
| BUG-009 | game / combat | Computed attack strength is possibly off by +1 for both attacker and defender — own dice count should not include the attacking die itself                                                 | P2 | open | — |

---

## Resolved Bugs

| ID | Component | Description | Priority | Status | Resolution |
|----|-----------|-------------|----------|--------|------------|
| — | — | — | — | — | — |
