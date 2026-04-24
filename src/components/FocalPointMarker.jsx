/**
 * FocalPointMarker component — renders a focal point indicator inside a hex.
 * Phase 4.3 — Focal point marker.
 */

import picFocalActive   from "../assets/pictogram/pictogram-focal-active.svg";
import picFocalInactive from "../assets/pictogram/pictogram-focal-inactive.svg";

/** Marker size as a fraction of hex circumradius. */
const MARKER_RATIO = 0.55;

/**
 * Renders a focal point marker as an SVG <g> element.
 *
 * @param {number}  props.cx       - Pixel x of marker centre in SVG space.
 * @param {number}  props.cy       - Pixel y of marker centre in SVG space.
 * @param {number}  props.hexSize  - Circumradius of the parent hex; controls marker scale.
 * @param {boolean} props.isActive - Whether this focal point is currently active.
 * @returns {JSX.Element}
 */
export function FocalPointMarker({ cx, cy, hexSize, isActive }) {
    const size   = hexSize * MARKER_RATIO;
    const src    = isActive ? picFocalActive : picFocalInactive;
    const filterId = isActive ? "focal-active-tint" : "focal-passive-tint";

    return (
        <image
            href={src}
            x={cx - size / 2}
            y={cy - size / 2}
            width={size}
            height={size}
            opacity={isActive ? 0.95 : 0.6}
        />
    );
}
