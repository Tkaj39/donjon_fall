/**
 * Shared UI constants for the action panel and action selection logic.
 * Phase 8.1 / 12.1 — Action panel ordering and labels.
 */

import picMoveDice      from "../assets/pictogram/pictogram-move-dice.svg";
import picMoveTower     from "../assets/pictogram/pictogram-move-tower.svg";
import picReroll        from "../assets/pictogram/pictogram-reroll.svg";
import picTowerCollapse from "../assets/pictogram/pictogram-tower-collapse.svg";

// ---------------------------------------------------------------------------
// Action ordering & labels
// ---------------------------------------------------------------------------

/**
 * Canonical display order for all action types.
 * "move-tower" and "collapse" are conditionally hidden in ActionPanel
 * when not applicable to the selected piece.
 *
 * @type {string[]}
 */
export const ACTION_ORDER = ["move-tower", "move-die", "reroll", "collapse"];

/**
 * Human-readable labels for each action key.
 *
 * @type {Object.<string, string>}
 */
export const ACTION_LABELS = {
    "move-tower": "Move tower",
    "move-die":   "Move die",
    "reroll":     "Reroll",
    "collapse":   "Collapse",
};

/**
 * Pictogram icon URL for each action key.
 *
 * @type {Object.<string, string>}
 */
export const ACTION_ICONS = {
    "move-tower": picMoveTower,
    "move-die":   picMoveDice,
    "reroll":     picReroll,
    "collapse":   picTowerCollapse,
};
