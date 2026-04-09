/**
 * Tests for the CombatPowerTooltip component.
 */

import { render } from '@testing-library/react';
import { CombatPowerTooltip } from '../../src/components/CombatPowerTooltip.jsx';

function renderTooltip(props) {
    return render(<CombatPowerTooltip {...props} />);
}

describe('CombatPowerTooltip — single strength mode', () => {
    test('renders combatStrength value when versus is null', () => {
        const { container } = renderTooltip({
            color: '#dc2626',
            combatStrength: 5,
            hoveredPlayerColor: '#dc2626',
            versus: null,
        });
        expect(container.textContent).toContain('5');
    });

    test('renders nothing inside SVG when combatStrength is null and versus is null', () => {
        const { container } = renderTooltip({
            color: null,
            combatStrength: null,
            hoveredPlayerColor: null,
            versus: null,
        });
        // No text content expected
        expect(container.querySelector('text')).toBeNull();
    });
});

describe('CombatPowerTooltip — versus mode', () => {
    const versus = {
        attackerStrength: 4,
        attackerColor:    '#dc2626',
        defenderStrength: 2,
        defenderColor:    '#3b82f6',
    };

    test('renders attacker strength when versus provided', () => {
        const { container } = renderTooltip({
            color: '#dc2626',
            combatStrength: null,
            hoveredPlayerColor: null,
            versus,
        });
        const tspans = container.querySelectorAll('tspan');
        const texts = [...tspans].map(t => t.textContent);
        expect(texts).toContain('4');
    });

    test('renders defender strength when versus provided', () => {
        const { container } = renderTooltip({
            color: '#dc2626',
            combatStrength: null,
            hoveredPlayerColor: null,
            versus,
        });
        const tspans = container.querySelectorAll('tspan');
        const texts = [...tspans].map(t => t.textContent);
        expect(texts).toContain('2');
    });

    test('versus mode renders "x" separator tspan', () => {
        const { container } = renderTooltip({
            color: '#dc2626',
            combatStrength: null,
            hoveredPlayerColor: null,
            versus,
        });
        const tspans = [...container.querySelectorAll('tspan')];
        expect(tspans.some(t => t.textContent.includes('x'))).toBe(true);
    });

    test('versus mode takes precedence over combatStrength', () => {
        const { container } = renderTooltip({
            color: '#dc2626',
            combatStrength: 99,
            hoveredPlayerColor: '#dc2626',
            versus,
        });
        // Should show 4 and 2, not 99
        const text = container.textContent;
        expect(text).not.toContain('99');
        expect(text).toContain('4');
    });
});

describe('CombatPowerTooltip — SVG structure', () => {
    test('renders an SVG element', () => {
        const { container } = renderTooltip({
            color: '#dc2626',
            combatStrength: 3,
            hoveredPlayerColor: '#dc2626',
            versus: null,
        });
        expect(container.querySelector('svg')).not.toBeNull();
    });

    test('renders hex polygon background', () => {
        const { container } = renderTooltip({
            color: '#dc2626',
            combatStrength: 3,
            hoveredPlayerColor: '#dc2626',
            versus: null,
        });
        expect(container.querySelector('polygon')).not.toBeNull();
    });
});