/**
 * ActionPanel component — action selector shown when a piece is selected.
 * Phase 8.1 — Action panel.
 *
 * Actions are listed in fixed order: Move tower (hidden if not a tower),
 * Move die, Reroll. The first applicable action is pre-selected automatically.
 * Disabled when the action is not in availableActions or actionTaken is true.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Canonical ordered action list.
 * 'move-tower' is filtered out when the selected piece is not a tower.
 */
const ACTION_ORDER = ['move-tower', 'move-die', 'reroll'];

/** Human-readable labels for each action key. */
const ACTION_LABELS = {
    'move-tower': 'Move tower',
    'move-die':   'Move die',
    'reroll':     'Reroll',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Bottom action bar shown while a piece is selected during the action phase.
 *
 * @param {Object}   props
 * @param {string}   props.currentPlayer
 *   ID of the active player (used for styling).
 * @param {string[]} props.availableActions
 *   Actions that are currently legal, e.g. `['move-tower', 'move-die', 'reroll']`.
 *   Only actions in this list can be selected; others render disabled.
 *   `'move-tower'` must be included to make that button visible at all.
 * @param {string|null} props.activeAction
 *   The currently selected action key, or null if none selected yet.
 * @param {function(string): void} props.onActionSelect
 *   Callback invoked with the action key when the player picks an action.
 * @returns {JSX.Element}
 */
export function ActionPanel({ currentPlayer, availableActions, activeAction, onActionSelect }) {
    const available = new Set(availableActions);

    // Show move-tower only when it is available (i.e. selected piece is a tower)
    const visibleActions = ACTION_ORDER.filter(
        (a) => a !== 'move-tower' || available.has('move-tower'),
    );

    return (
        <div
            role="toolbar"
            aria-label="Action panel"
            style={{
                display:       'flex',
                gap:           '0.5rem',
                background:    'var(--color-panel-bg, #1e293b)',
                border:        '2px solid var(--color-panel-border, #475569)',
                borderRadius:  '0.75rem',
                padding:       '0.6rem 0.8rem',
                color:         'var(--color-panel-text, #f1f5f9)',
                boxShadow:     '0 4px 16px rgba(0,0,0,0.4)',
            }}
        >
            {visibleActions.map((actionKey) => {
                const isActive   = actionKey === activeAction;
                const isDisabled = !available.has(actionKey);

                return (
                    <button
                        key={actionKey}
                        data-testid={`action-btn-${actionKey}`}
                        disabled={isDisabled}
                        aria-pressed={isActive}
                        onClick={() => !isDisabled && onActionSelect(actionKey)}
                        style={{
                            padding:       '0.45rem 1rem',
                            borderRadius:  '0.5rem',
                            border:        isActive
                                ? '2px solid var(--color-accent, #f59e0b)'
                                : '2px solid transparent',
                            background:    isActive
                                ? 'var(--color-accent-dim, rgba(245,158,11,0.18))'
                                : isDisabled
                                    ? 'rgba(255,255,255,0.04)'
                                    : 'rgba(255,255,255,0.08)',
                            color:         isDisabled
                                ? 'rgba(255,255,255,0.25)'
                                : isActive
                                    ? 'var(--color-accent, #f59e0b)'
                                    : 'var(--color-panel-text, #f1f5f9)',
                            fontWeight:    isActive ? 700 : 500,
                            fontSize:      '0.875rem',
                            cursor:        isDisabled ? 'not-allowed' : 'pointer',
                            transition:    'background 0.12s, border-color 0.12s, color 0.12s',
                            whiteSpace:    'nowrap',
                        }}
                    >
                        {ACTION_LABELS[actionKey]}
                    </button>
                );
            })}
        </div>
    );
}
