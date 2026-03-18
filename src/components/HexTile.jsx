import { hexCorners } from "../hex/hexUtils";

// Renders a single pointy-top SVG hexagon.
// cx            — pixel x coordinate of the hex center
// cy            — pixel y coordinate of the hex center
// size          — circumradius of the hex in pixels (center to corner)
// isHighlighted — true when the hex is a valid move target; renders in highlight color
// isFocalPoint  — true when the hex is one of the 3 focal point fields; renders a dot marker
// isSelected    — true when the hex holds the currently selected die; takes priority over highlight/focal colors
// onClick       — optional click handler; cursor becomes pointer when provided
// children      — SVG content rendered inside the hex group (e.g. dice)
export default function HexTile({ cx, cy, size, isHighlighted, isFocalPoint, isSelected, onClick, children }) {
    const corners = hexCorners(cx, cy, size);
    const points = corners.map(({x, y}) => `${x},${y}`).join(' ');

    let fill = 'var(--color-hex-default)';
    if (isSelected) fill = 'var(--color-hex-selected)';
    else if (isHighlighted) fill = 'var(--color-hex-highlighted)';
    else if (isFocalPoint) fill = 'var(--color-hex-focal)';

    return (
        <g onClick={onClick} style={{cursor: onClick ? 'pointer' : 'default'}}>
            <polygon
                points={points}
                fill={fill}
                stroke="var(--color-hex-stroke)"
                strokeWidth={1.5}
            />
            {isFocalPoint && (
                <circle cx={cx} cy={cy} r={size * 0.18} fill="var(--color-focal-marker)" opacity={0.6}/>
            )}
            {children}
        </g>
    );
}
