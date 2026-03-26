/**
 * Tests for the CombatOverlay component (Phase 5.4).
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { CombatOverlay } from '../../src/components/CombatOverlay.jsx';

/** Hex keys used across tests. */
const ATTACKER_HEX = '0,0,0';
const DEFENDER_HEX = '1,-1,0';

/**
 * Builds a minimal GameState with one attacker die and one defender die.
 *
 * @param {{ attackerValue?: number, defenderValue?: number, options?: string[] }} overrides
 * @returns {import('../../src/game/gameState.js').GameState}
 */
function makeState({ attackerValue = 4, defenderValue = 2, options = ['push', 'occupy'] } = {}) {
    return {
        players:            ['red', 'blue'],
        currentPlayer:      'red',
        phase:              'combat',
        dice: {
            [ATTACKER_HEX]: [{ owner: 'red',  value: attackerValue }],
            [DEFENDER_HEX]: [{ owner: 'blue', value: defenderValue }],
        },
        focalPoints:        {},
        scores:             { red: 0, blue: 0 },
        activeFocalHolders: { red: null, blue: null },
        combat: {
            attackerHex:  ATTACKER_HEX,
            defenderHex:  DEFENDER_HEX,
            approachDirection: ATTACKER_HEX,
            options,
        },
        selectedHex:        null,
        highlightedHexes:   [],
        actionTaken:        false,
    };
}

describe('CombatOverlay', () => {
    test('renders a dialog with combat label', () => {
        render(<CombatOverlay state={makeState()} options={['push', 'occupy']} onChoose={() => {}} />);
        expect(screen.getByRole('dialog', { name: /combat/i })).toBeInTheDocument();
    });

    test('displays attacker strength', () => {
        // single die value 5 → strength = 5 + 1 own − 0 enemy = 6
        render(<CombatOverlay state={makeState({ attackerValue: 5 })} options={['push']} onChoose={() => {}} />);
        expect(screen.getByTestId('attacker-strength')).toHaveTextContent('6');
    });

    test('displays defender strength', () => {
        // single die value 3 → strength = 3 + 1 own − 0 enemy = 4
        render(<CombatOverlay state={makeState({ defenderValue: 3 })} options={['push']} onChoose={() => {}} />);
        expect(screen.getByTestId('defender-strength')).toHaveTextContent('4');
    });

    test('renders push and occupy buttons when both options available', () => {
        render(<CombatOverlay state={makeState()} options={['push', 'occupy']} onChoose={() => {}} />);
        expect(screen.getByRole('button', { name: /push/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /occupy/i })).toBeInTheDocument();
    });

    test('renders only push button when occupy not available', () => {
        render(<CombatOverlay state={makeState()} options={['push']} onChoose={() => {}} />);
        expect(screen.getByRole('button', { name: /push/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /occupy/i })).toBeNull();
    });

    test('calls onChoose with "push" when push button clicked', () => {
        const onChoose = vi.fn();
        render(<CombatOverlay state={makeState()} options={['push', 'occupy']} onChoose={onChoose} />);
        fireEvent.click(screen.getByRole('button', { name: /push/i }));
        expect(onChoose).toHaveBeenCalledWith('push');
    });

    test('calls onChoose with "occupy" when occupy button clicked', () => {
        const onChoose = vi.fn();
        render(<CombatOverlay state={makeState()} options={['push', 'occupy']} onChoose={onChoose} />);
        fireEvent.click(screen.getByRole('button', { name: /occupy/i }));
        expect(onChoose).toHaveBeenCalledWith('occupy');
    });

    test('attacker strength accounts for tower size', () => {
        // Attacker has 2 own dice on same hex → strength = value + 2 own - 0 enemy = value + 2
        const state = makeState({ attackerValue: 3 });
        state.dice[ATTACKER_HEX] = [
            { owner: 'red', value: 2 },
            { owner: 'red', value: 3 },
        ];
        render(<CombatOverlay state={state} options={['push']} onChoose={() => {}} />);
        // top die value 3, own 2, enemy 0 → strength = 3 + 2 - 0 = 5
        expect(screen.getByTestId('attacker-strength')).toHaveTextContent('5');
    });
});
