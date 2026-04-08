/**
 * Hex-shaped element that reflects the active player's colour and shows either:
 *  - A single combat strength when hovering any die/tower.
 *  - Both attacker and defender strengths ("A x D") when hovering a reachable enemy.
 *
 * @param {{
 *   color: string,
 *   combatStrength: number|null,
 *   hoveredPlayerColor: string|null,
 *   versus: { attackerStrength: number, attackerColor: string, defenderStrength: number, defenderColor: string } | null,
 * }} props
 * @returns {JSX.Element}
 */
export function CombatPowerTooltip({ color, combatStrength, hoveredPlayerColor, versus }) {
    const fill = color
        ? `color-mix(in srgb, ${color} 20%, transparent)`
        : "rgba(255,255,255,0.04)";

    return (
        <svg width="72" height="83" viewBox="0 0 86.6 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon
                points="43.3,0 86.6,25 86.6,75 43.3,100 0,75 0,25"
                fill={fill}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="2"
            />
            {versus ? (
                <text
                    x="43.3"
                    y="50"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="22"
                    fontWeight="bold"
                >
                    <tspan fill={versus.attackerColor}>{versus.attackerStrength}</tspan>
                    <tspan fill="rgba(255,255,255,0.5)"> x </tspan>
                    <tspan fill={versus.defenderColor}>{versus.defenderStrength}</tspan>
                </text>
            ) : combatStrength !== null && (
                <text
                    x="43.3"
                    y="50"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="36"
                    fontWeight="bold"
                    fill={hoveredPlayerColor ?? "rgba(255,255,255,0.9)"}
                >
                    {combatStrength}
                </text>
            )}
        </svg>
    );
}