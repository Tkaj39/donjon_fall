/**
 * CombatOverlay component — modal panel shown when combat needs to be resolved.
 * Phase 5.4 — Combat overlay UI.
 *
 * Displays the attacker and defender's attack strengths and lets the current
 * player choose between the available combat options (push / occupy).
 */

import { getAttackStrength } from '../game/gameState.js';

/** Human-readable labels for each combat option. */
const OPTION_LABELS = {
    push:   'Push',
    occupy: 'Occupy',
};

/**
 * Overlay panel that appears during the 'combat' phase.
 *
 * @param {Object}  props
 * @param {import('../game/gameState.js').GameState} props.state
 *   Full game state — used to derive attacker/defender strengths and hex refs.
 * @param {Array<'push'|'occupy'>} props.options
 *   Available combat options (from `getAvailableCombatOptions`).
 * @param {function('push'|'occupy'): void} props.onChoose
 *   Callback invoked when the player picks an option.
 * @returns {JSX.Element}
 */
export function CombatOverlay({ state, options, onChoose }) {
    const { attackerHex, defenderHex } = state.combat;
    const attackerStrength = getAttackStrength(state, attackerHex);
    const defenderStrength = getAttackStrength(state, defenderHex);

    return (
        <div
            role="dialog"
            aria-label="Combat resolution"
            style={{
                position:        'absolute',
                top:             '50%',
                left:            '50%',
                transform:       'translate(-50%, -50%)',
                background:      'var(--color-panel-bg, #1e293b)',
                border:          '2px solid var(--color-panel-border, #475569)',
                borderRadius:    '0.75rem',
                padding:         '1.25rem 1.5rem',
                minWidth:        '14rem',
                textAlign:       'center',
                color:           'var(--color-panel-text, #f1f5f9)',
                zIndex:          100,
                boxShadow:       '0 8px 32px rgba(0,0,0,0.5)',
            }}
        >
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem', fontWeight: 700 }}>
                Combat
            </h2>

            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '1rem' }}>
                <div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Attacker</div>
                    <div
                        data-testid="attacker-strength"
                        style={{ fontSize: '1.5rem', fontWeight: 700 }}
                    >
                        {attackerStrength}
                    </div>
                </div>
                <div style={{ alignSelf: 'center', opacity: 0.5 }}>vs</div>
                <div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Defender</div>
                    <div
                        data-testid="defender-strength"
                        style={{ fontSize: '1.5rem', fontWeight: 700 }}
                    >
                        {defenderStrength}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                {options.map(option => (
                    <button
                        key={option}
                        onClick={() => onChoose(option)}
                        style={{
                            padding:       '0.4rem 1rem',
                            borderRadius:  '0.4rem',
                            border:        '1px solid var(--color-panel-border, #475569)',
                            background:    'var(--color-btn-bg, #334155)',
                            color:         'inherit',
                            cursor:        'pointer',
                            fontWeight:    600,
                        }}
                    >
                        {OPTION_LABELS[option] ?? option}
                    </button>
                ))}
            </div>
        </div>
    );
}
