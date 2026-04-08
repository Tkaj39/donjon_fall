/**
 * VictoryScreen component — full-screen overlay shown when the game ends.
 * Phase 8.2 — Victory screen.
 *
 * Displayed when a player reaches 5 VP or the opponent has no legal moves.
 */

/** CSS colour for each known player ID. Fallback used for unknown IDs. */
const PLAYER_COLORS = {
    red:  "#ef4444",
    blue: "#3b82f6",
};

/** Fallback colour for player IDs not in PLAYER_COLORS. */
const FALLBACK_COLOR = "#94a3b8";

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
import { Logo } from "./Logo.jsx";

export function VictoryScreen({ winner, onNewGame }) {
    const color = PLAYER_COLORS[winner] ?? FALLBACK_COLOR;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Victory screen"
            className="fixed inset-0 flex flex-col items-center justify-center bg-[rgba(0,0,0,0.82)] z-[200] gap-6"
        >
            <Logo className="w-20 h-20" />
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
                className="m-0 text-[2.2rem] font-extrabold text-[#f1f5f9] text-center leading-[1.1]"
            >
                Victory!
            </h1>

            <p
                data-testid="winner-label"
                className="m-0 text-[1.2rem] font-semibold capitalize text-center"
                style={{ color }}
            >
                {winner} wins
            </p>

            <button
                data-testid="new-game-btn"
                onClick={onNewGame}
                className="mt-2 py-[0.65rem] px-8 rounded-[0.6rem] border-0 text-white font-bold text-base cursor-pointer transition-opacity duration-150"
                style={{ background: color, boxShadow: `0 4px 20px ${color}55` }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
                New game
            </button>
        </div>
    );
}
