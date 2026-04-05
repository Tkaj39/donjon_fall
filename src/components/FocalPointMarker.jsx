/**
 * FocalPointMarker component — renders a focal point indicator inside a hex.
 * Phase 4.3 — Focal point marker.
 *
 * Active focal points display a bright 5-pointed star.
 * Passive focal points display a small muted circle.
 */

/** Outer star tip radius as a fraction of hex size. */
const STAR_OUTER_RATIO = 0.28;

/** Inner star notch radius as a fraction of hex size. */
const STAR_INNER_RATIO = 0.12;

/** Passive circle radius as a fraction of hex size. */
const PASSIVE_RADIUS_RATIO = 0.18;

/**
 * Computes the SVG polygon `points` string for a regular 5-pointed star.
 *
 * @param {number} cx       - Centre x in SVG space.
 * @param {number} cy       - Centre y in SVG space.
 * @param {number} outerR   - Outer tip radius in pixels.
 * @param {number} innerR   - Inner notch radius in pixels.
 * @returns {string} Space-separated "x,y" pairs ready for a <polygon points> attribute.
 */
function starPoints(cx, cy, outerR, innerR) {
    const NUM_POINTS = 5;
    const pts = [];
    for (let i = 0; i < NUM_POINTS * 2; i++) {
        const angle = (Math.PI / NUM_POINTS) * i - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return pts.join(" ");
}

/**
 * Renders a focal point marker as an SVG <g> element.
 * Active: bright gold 5-pointed star. Passive: small muted circle.
 *
 * @param {number}  props.cx      - Pixel x of marker centre in SVG space.
 * @param {number}  props.cy      - Pixel y of marker centre in SVG space.
 * @param {number}  props.hexSize - Circumradius of the parent hex; controls marker scale.
 * @param {boolean} props.isActive - Whether this focal point is currently active.
 * @returns {JSX.Element}
 */
export function FocalPointMarker({ cx, cy, hexSize, isActive }) {
    if (isActive) {
        const outerR = hexSize * STAR_OUTER_RATIO;
        const innerR = hexSize * STAR_INNER_RATIO;
        return (
            <polygon
                points={starPoints(cx, cy, outerR, innerR)}
                fill="var(--color-focal-active)"
                stroke="var(--color-focal-active-stroke)"
                strokeWidth={1}
                opacity={0.9}
            />
        );
    }

    return (
        <circle
            cx={cx}
            cy={cy}
            r={hexSize * PASSIVE_RADIUS_RATIO}
            fill="var(--color-focal-passive)"
            stroke="var(--color-focal-active-stroke)"
            strokeWidth={1.5}
            opacity={0.85}
        />
    );
}
