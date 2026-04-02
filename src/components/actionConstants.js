/**
 * Shared UI constants for the action panel and action selection logic.
 * Phase 8.1 / 12.1 — Action panel ordering and labels.
 */

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
