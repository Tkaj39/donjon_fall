/**
 * ScoreBoard component — displays current victory point totals for all players.
 * Phase 7.3 — Score display.
 */

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
 * Panel showing the victory point total for each player.
 *
 * @param {Object}                 props
 * @param {string[]}               props.players - Ordered list of player IDs.
 * @param {{ [playerId]: number }} props.scores  - Current VP totals keyed by player ID.
 * @returns {JSX.Element}
 */
export function ScoreBoard({ players, scores }) {
    return (
        <div
            role="region"
            aria-label="Score board"
            style={{
                display:       'flex',
                gap:           '1rem',
                background:    'var(--color-panel-bg, #1e293b)',
                border:        '2px solid var(--color-panel-border, #475569)',
                borderRadius:  '0.75rem',
                padding:       '0.6rem 1rem',
                color:         'var(--color-panel-text, #f1f5f9)',
                boxShadow:     '0 4px 16px rgba(0,0,0,0.4)',
            }}
        >
            {players.map((playerId) => (
                <div
                    key={playerId}
                    data-testid={`score-${playerId}`}
                    style={{
                        display:    'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        minWidth:   '3.5rem',
                    }}
                >
                    <span
                        style={{
                            fontSize:    '0.7rem',
                            fontWeight:  600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color:       PLAYER_COLORS[playerId] ?? FALLBACK_COLOR,
                        }}
                    >
                        {playerId}
                    </span>
                    <span
                        data-testid={`score-value-${playerId}`}
                        style={{ fontSize: '1.8rem', fontWeight: 700, lineHeight: 1.1 }}
                    >
                        {scores[playerId] ?? 0}
                    </span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>VP</span>
                </div>
            ))}
        </div>
    );
}
