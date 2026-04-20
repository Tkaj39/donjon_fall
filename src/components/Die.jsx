/**
 * Die component — renders a single D6 face as an SVG element.
 * Phase 4.2 — Die rendering.
 */

// ---------------------------------------------------------------------------
// Pip layout
// ---------------------------------------------------------------------------

/**
 * Relative [x, y] pip positions as fractions of die face half-width.
 * Origin at die centre; values are in the [-0.5, 0.5] range.
 * Indexed by face value (index 0 unused).
 */
const PIP_LAYOUTS = [
    [],                                                                                     // 0 (unused)
    [[0, 0]],                                                                               // 1
    [[-0.22, -0.22], [0.22, 0.22]],                                                        // 2
    [[-0.22, -0.22], [0, 0], [0.22, 0.22]],                                                // 3
    [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]],                         // 4
    [[-0.22, -0.22], [0.22, -0.22], [0, 0], [-0.22, 0.22], [0.22, 0.22]],                 // 5
    [[-0.22, -0.25], [0.22, -0.25], [-0.22, 0], [0.22, 0], [-0.22, 0.25], [0.22, 0.25]], // 6
];

/** Die face side length as a fraction of the parent hex circumradius. */
const DIE_FACE_RATIO = 0.65;

/** Pip radius as a fraction of the parent hex circumradius. */
const PIP_RADIUS_RATIO = 0.065;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders a single D6 face as an SVG <g> element with pip dots.
 * Must be placed inside an <svg> that uses the same coordinate system as the board.
 *
 * @param {number}       props.cx      - Pixel x of die centre in SVG space.
 * @param {number}       props.cy      - Pixel y of die centre in SVG space.
 * @param {number}       props.hexSize - Circumradius of the parent hex; controls die scale.
 * @param {1|2|3|4|5|6} props.value   - Die face value to display.
 * @param {string}       props.color   - CSS colour string for the die body.
 * @param {boolean}      [props.isTop] - Whether this is the topmost die in a stack; non-top dice are dimmed.
 * @returns {JSX.Element}
 */
export function Die({ cx, cy, hexSize, value, color, isTop = true }) {
    const half = (hexSize * DIE_FACE_RATIO) / 2;
    const pipRadius = hexSize * PIP_RADIUS_RATIO;
    const pips = PIP_LAYOUTS[value] ?? [];

    const gradId = `die-dim-${cx}-${cy}`;

    return (
        <g>
            {!isTop && (
                <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="rgba(0,0,0,0.55)" />
                        <stop offset="100%" stopColor="rgba(0,0,0,0)"    />
                    </linearGradient>
                </defs>
            )}
            <rect
                x={cx - half}
                y={cy - half}
                width={half * 2}
                height={half * 2}
                rx={half * 0.3}
                fill={color}
                stroke="rgba(0,0,0,0.35)"
                strokeWidth={1}
            />
            {!isTop && (
                <rect
                    x={cx - half}
                    y={cy - half}
                    width={half * 2}
                    height={half * 2}
                    rx={half * 0.3}
                    fill={`url(#${gradId})`}
                    className="pointer-events-none"
                />
            )}
            {pips.map(([relX, relY], pipIndex) => (
                <circle
                    key={pipIndex}
                    cx={cx + relX * half * 2}
                    cy={cy + relY * half * 2}
                    r={pipRadius}
                    fill="white"
                    opacity={0.9}
                />
            ))}
        </g>
    );
}
