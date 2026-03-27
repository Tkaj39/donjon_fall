/**
 * VictoryScreen component — full-screen overlay shown when the game ends.
 * Phase 8.2 — Victory screen.
 *
 * Displayed when a player reaches 5 VP or the opponent has no legal moves.
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
 * Full-screen victory overlay shown at the end of the game.
 *
 * @param {Object}   props
 * @param {string}   props.winner    - Player ID of the winning player.
 * @param {function} props.onNewGame - Callback invoked when the player clicks "New game".
 * @returns {JSX.Element}
 */
export function VictoryScreen({ winner, onNewGame }) {
    const color = PLAYER_COLORS[winner] ?? FALLBACK_COLOR;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Victory screen"
            style={{
                position:       'fixed',
                inset:          0,
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                background:     'rgba(0,0,0,0.82)',
                zIndex:         200,
                gap:            '1.5rem',
            }}
        >
            {/* Trophy / crown icon (SVG, no external asset needed) */}
            <svg
                aria-hidden="true"
                width="72"
                height="72"
                viewBox="0 0 72 72"
                fill="none"
            >
                <circle cx="36" cy="36" r="36" fill={color} opacity="0.15" />
                {/* Simple crown shape */}
                <polygon
                    points="14,50 20,28 36,40 52,28 58,50"
                    fill={color}
                    opacity="0.85"
                />
                <rect x="14" y="50" width="44" height="6" rx="3" fill={color} />
            </svg>

            <h1
                style={{
                    margin:     0,
                    fontSize:   '2.2rem',
                    fontWeight: 800,
                    color:      '#f1f5f9',
                    textAlign:  'center',
                    lineHeight: 1.1,
                }}
            >
                Victory!
            </h1>

            <p
                data-testid="winner-label"
                style={{
                    margin:        0,
                    fontSize:      '1.2rem',
                    fontWeight:    600,
                    color,
                    textTransform: 'capitalize',
                    textAlign:     'center',
                }}
            >
                {winner} wins
            </p>

            <button
                data-testid="new-game-btn"
                onClick={onNewGame}
                style={{
                    marginTop:    '0.5rem',
                    padding:      '0.65rem 2rem',
                    borderRadius: '0.6rem',
                    border:       'none',
                    background:   color,
                    color:        '#fff',
                    fontWeight:   700,
                    fontSize:     '1rem',
                    cursor:       'pointer',
                    boxShadow:    `0 4px 20px ${color}55`,
                    transition:   'opacity 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
                New game
            </button>
        </div>
    );
}
