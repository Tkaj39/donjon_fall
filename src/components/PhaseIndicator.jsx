/**
 * PhaseIndicator component — shows whose turn it is and the current game phase.
 * Phase 7.4 — Phase indicator.
 */

/** Human-readable label for each game phase. */
const PHASE_LABELS = {
    focal:   'Focal Points',
    action:  'Action',
    combat:  'Combat',
    victory: 'Victory',
};

/** CSS colour for each known player ID. Fallback used for unknown IDs. */
const PLAYER_COLORS = {
    red:  '#ef4444',
    blue: '#3b82f6',
};

/** Fallback colour for player IDs not in PLAYER_COLORS. */
const FALLBACK_COLOR = '#94a3b8';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Compact banner displaying the current player's turn and active game phase.
 *
 * @param {Object} props
 * @param {'focal'|'action'|'combat'|'victory'} props.phase         - Current game phase.
 * @param {string}                               props.currentPlayer - Active player ID.
 * @returns {JSX.Element}
 */
export function PhaseIndicator({ phase, currentPlayer }) {
    const playerColor = PLAYER_COLORS[currentPlayer] ?? FALLBACK_COLOR;
    const phaseLabel  = PHASE_LABELS[phase] ?? phase;

    return (
        <div
            role="status"
            aria-label="Phase indicator"
            style={{
                display:       'flex',
                alignItems:    'center',
                gap:           '0.6rem',
                background:    'var(--color-panel-bg, #1e293b)',
                border:        '2px solid var(--color-panel-border, #475569)',
                borderRadius:  '0.75rem',
                padding:       '0.5rem 1rem',
                color:         'var(--color-panel-text, #f1f5f9)',
                boxShadow:     '0 4px 16px rgba(0,0,0,0.4)',
            }}
        >
            {/* Player colour dot */}
            <span
                aria-hidden="true"
                style={{
                    display:      'inline-block',
                    width:        '0.75rem',
                    height:       '0.75rem',
                    borderRadius: '50%',
                    background:   playerColor,
                    flexShrink:   0,
                }}
            />

            {/* Player name */}
            <span
                data-testid="current-player"
                style={{
                    fontWeight:    700,
                    color:         playerColor,
                    textTransform: 'capitalize',
                    fontSize:      '0.9rem',
                }}
            >
                {currentPlayer}
            </span>

            {/* Separator */}
            <span style={{ opacity: 0.35, fontSize: '0.85rem' }}>·</span>

            {/* Phase label */}
            <span
                data-testid="current-phase"
                style={{ fontSize: '0.85rem', opacity: 0.85 }}
            >
                {phaseLabel}
            </span>
        </div>
    );
}
