/**
 * DirectionPickerOverlay — Phase 12.4 approach direction picker.
 *
 * Rendered inside a HexTile <g> when the trajectory destination is an enemy
 * hex that can be approached from more than one direction. Visually divides the
 * hex into up to 6 pie segments (one per valid approach direction). Moving the
 * mouse over a segment highlights it; the parent is notified via
 * `onApproachHover` so it can update the selected approach direction.
 *
 * Event strategy:
 *  - A transparent <polygon> covering the full hex catches mousemove.
 *  - Pie segment <path> elements are visual-only (pointerEvents: "none") so
 *    they do not interfere with click events bubbling to HexTile"s <g>.
 */

import { hexCorners, hexFromKey } from "../hex/hexUtils.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Central angle (degrees, SVG space) of each cube direction for a pointy-top
 * hex rendered by hexToPixel.
 *
 * Derived from hexToPixel({q, r}) = {x: size*(√3·q + (√3/2)·r), y: size·(3/2)·r}:
 *   {q:1,r:-1} → atan2(-1.5, √3/2) ≈ -60°
 *   {q:1,r: 0} → atan2(0, √3)      =   0°
 *   {q:0,r: 1} → atan2( 1.5, √3/2) ≈  60°
 *   etc.
 *
 * @type {Object.<string, number>}
 */
const DIR_ANGLES = {
    "1,-1,0":   -60,
    "1,0,-1":     0,
    "0,1,-1":    60,
    "-1,1,0":   120,
    "-1,0,1":   180,
    "0,-1,1":  -120,
};

/** Each of the 6 segments spans 60°; this is the half-width. */
const SEGMENT_HALF_ARC_DEG = 30;

/**
 * Outer radius of each pie segment, as a fraction of the hex circumradius.
 * Slightly smaller than 1 so the hex stroke remains visible underneath.
 */
const SEGMENT_RADIUS_RATIO = 0.85;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Converts degrees to radians.
 *
 * @param {number} deg
 * @returns {number}
 */
function toRad(deg) {
    return (deg * Math.PI) / 180;
}

/**
 * Returns the smallest angular distance (0–180) between two angles in degrees,
 * handling 360° wraparound.
 *
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function angularDistance(a, b) {
    const diff = Math.abs(((a - b) % 360 + 360) % 360);
    return diff > 180 ? 360 - diff : diff;
}

/**
 * Returns the SVG pie-segment path string for a wedge centred on `centralAngle`
 * spanning ±SEGMENT_HALF_ARC_DEG from the hex centre.
 *
 * @param {number} cx           - Hex centre x in SVG coords.
 * @param {number} cy           - Hex centre y in SVG coords.
 * @param {number} R            - Segment outer radius in pixels.
 * @param {number} centralAngle - Central angle of the segment in degrees.
 * @returns {string}            - SVG path `d` attribute value.
 */
function segmentPath(cx, cy, R, centralAngle) {
    const start = toRad(centralAngle - SEGMENT_HALF_ARC_DEG);
    const end   = toRad(centralAngle + SEGMENT_HALF_ARC_DEG);
    const x1 = cx + R * Math.cos(start);
    const y1 = cy + R * Math.sin(start);
    const x2 = cx + R * Math.cos(end);
    const y2 = cy + R * Math.sin(end);
    return `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} Z`;
}

/**
 * Returns the cube-direction key `"dq,dr,ds"` pointing from the enemy hex
 * toward the given approach hex.
 *
 * @param {string} enemyHexKey    - hexKey of the defender"s hex.
 * @param {string} approachHexKey - hexKey of the approach (penultimate) hex.
 * @returns {string}
 */
function cubeDirectionKey(enemyHexKey, approachHexKey) {
    const e = hexFromKey(enemyHexKey);
    const a = hexFromKey(approachHexKey);
    return `${a.q - e.q},${a.r - e.r},${a.s - e.s}`;
}

/**
 * Returns the central segment angle in degrees for the given approach hex.
 *
 * @param {string} enemyHexKey
 * @param {string} approachHexKey
 * @returns {number}
 */
function approachAngle(enemyHexKey, approachHexKey) {
    return DIR_ANGLES[cubeDirectionKey(enemyHexKey, approachHexKey)] ?? 0;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * SVG overlay rendered inside a HexTile that lets the player pick which
 * direction they approach the enemy hex from, before committing the attack.
 *
 * @param {Object}      props
 * @param {number}      props.cx                   - Hex centre x in SVG pixels.
 * @param {number}      props.cy                   - Hex centre y in SVG pixels.
 * @param {number}      props.size                 - Hex circumradius in pixels.
 * @param {string}      props.enemyHexKey           - hexKey of the enemy hex being targeted.
 * @param {Set<string>} props.validApproachKeys     - Approach hexKeys available for this attack.
 * @param {string|null} props.selectedApproachKey   - Currently highlighted approach hexKey.
 * @param {function(string): void} props.onApproachHover
 *   Called with the approach hexKey whose segment the mouse is closest to.
 * @returns {JSX.Element}
 */
export function DirectionPickerOverlay({
    cx,
    cy,
    size,
    enemyHexKey,
    validApproachKeys,
    selectedApproachKey,
    onApproachHover,
}) {
    const R = size * SEGMENT_RADIUS_RATIO;

    // Transparent polygon covering the full hex to catch mousemove events.
    const corners    = hexCorners(cx, cy, size);
    const hexPoints  = corners.map(({ x, y }) => `${x},${y}`).join(" ");

    /**
     * On mouse movement, finds the valid approach direction whose segment
     * centre is closest to the cursor angle and notifies the parent.
     *
     * @param {React.MouseEvent<SVGPolygonElement>} e
     * @returns {void}
     */
    function handleMouseMove(e) {
        const svg = e.currentTarget.ownerSVGElement;
        if (!svg) return;

        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());

        const mouseDeg = (Math.atan2(svgPt.y - cy, svgPt.x - cx) * 180) / Math.PI;

        let closest  = null;
        let minDist  = Infinity;
        for (const approachKey of validApproachKeys) {
            const segAngle = approachAngle(enemyHexKey, approachKey);
            const dist     = angularDistance(mouseDeg, segAngle);
            if (dist < minDist) {
                minDist  = dist;
                closest  = approachKey;
            }
        }
        if (closest !== null && closest !== selectedApproachKey) {
            onApproachHover(closest);
        }
    }

    return (
        <g>
            {/* Transparent polygon catches mousemove; clicks bubble to HexTile. */}
            <polygon
                points={hexPoints}
                fill="transparent"
                stroke="none"
                onMouseMove={handleMouseMove}
            />
            {[...validApproachKeys].map((approachKey) => {
                const angle      = approachAngle(enemyHexKey, approachKey);
                const isSelected = approachKey === selectedApproachKey;
                return (
                    <path
                        key={approachKey}
                        d={segmentPath(cx, cy, R, angle)}
                        fill={isSelected
                            ? "var(--color-dir-selected, rgba(251,191,36,0.65))"
                            : "var(--color-dir-available, rgba(251,191,36,0.18))"}
                        stroke="var(--color-dir-stroke, rgba(251,191,36,0.75))"
                        strokeWidth={1}
                        className="pointer-events-none"
                    />
                );
            })}
        </g>
    );
}