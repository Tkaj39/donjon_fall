import { hexCorners } from "../hex/hexUtils";

// Renders a single pointy-top SVG hexagon.
// center_x      — pixel x coordinate of the hex center
// center_y      — pixel y coordinate of the hex center
// size          — circumradius of the hex in pixels (center to corner)
// isHighlighted — renders highlighted hex if true
// isFocalPoint  — renders focal point hex if true
// isSelected    — renders selected hex if true
// onClick       — optional click handler; cursor becomes pointer when provided
// children      — SVG content rendered inside the hex group (e.g. dice)
export default function HexTile({ center_x, center_y, size, isHighlighted, isFocalPoint, isSelected, onClick, children }) {
    const corners = hexCorners(center_x, center_y, size);
    const points = corners.map(({x, y}) => `${x},${y}`).join(' ');

    let fill = 'var(--color-hex-default)';
    if (isSelected) fill = 'var(--color-hex-selected)'; // takes priority over highlighted/focal point render
    else if (isHighlighted) fill = 'var(--color-hex-highlighted)';
    else if (isFocalPoint) fill = 'var(--color-hex-focal)';

    return (
        <g className={`${onClick ? "pointer" : "default"}`} onClick={onClick}>
            <polygon
                points={points}
                fill={fill}
                stroke="var(--color-hex-stroke)"
                strokeWidth={1.5}
            />
            {isFocalPoint && (
                <circle cx={center_x} cy={center_y} r={size * 0.18} fill="var(--color-focal-marker)" opacity={0.6}/>
            )}
            {children}
        </g>
    );
}
