/**
 * Game component — top-level game orchestrator.
 * Phase 11.3 — Wires useGameState to the board, action panel, combat overlay,
 * victory screen, score board, phase indicator, and rules viewer.
 *
 * Click flow (action phase):
 *   1. Click own die              → select it; reachable hexes highlighted.
 *   2. Click reachable destination → dispatch move action; deselect.
 *   3. Click selected die again   → execute in-place action (reroll / collapse)
 *                                   or deselect if no in-place action is active.
 *
 * Focal phase is auto-advanced with fresh random rolls (no user interaction).
 * Combat phase is handled by CombatOverlay.
 * Victory is detected and shown via VictoryScreen.
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { useGameState } from '../hooks/useGameState.js';
import { getController, getTopDie, getTowerSize, canEnterTower } from '../game/gameState.js';
import {
    getReachableHexes,
    getTowerReachableHexes,
    canCollapse,
} from '../game/movement.js';
import { getAvailableCombatOptions } from '../game/combat.js';
import { hasLegalMoves } from '../game/turnManager.js';
import { BOARD_FIELDS } from '../hex/boardConstants.js';
import { Board } from './Board.jsx';
import { ActionPanel } from './ActionPanel.jsx';
import { CombatOverlay } from './CombatOverlay.jsx';
import { VictoryScreen } from './VictoryScreen.jsx';
import { ScoreBoard } from './ScoreBoard.jsx';
import { PhaseIndicator } from './PhaseIndicator.jsx';
import { RulesViewer } from './RulesViewer.jsx';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default player list for a two-player game. */
const PLAYERS = ['red', 'blue'];

/**
 * Preferred action selection order (matches ActionPanel's display order).
 * 'collapse' is appended at the end — disambiguation handled in Phase 12.3.
 */
const ACTION_ORDER = ['move-tower', 'move-die', 'reroll', 'collapse'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a random integer in [1, 6].
 *
 * @returns {number}
 */
function rollD6() {
    return Math.ceil(Math.random() * 6);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Top-level game orchestrator.
 * Intended to be used as the main game screen; receives no props — all state
 * is managed internally via useGameState.
 *
 * @returns {JSX.Element}
 */
export function Game() {
    const { state, dispatch } = useGameState(PLAYERS, BOARD_FIELDS);

    // -----------------------------------------------------------------------
    // Local UI state
    // -----------------------------------------------------------------------

    /** Hex key of the currently selected die, or null. */
    const [selectedHex, setSelectedHex] = useState(null);

    /**
     * Active action key: 'move-die' | 'move-tower' | 'reroll' | 'collapse' | null.
     * Auto-set to the first applicable action when a hex is selected.
     */
    const [activeAction, setActiveAction] = useState(null);

    /** Whether the rules modal is open. */
    const [showRules, setShowRules] = useState(false);

    // -----------------------------------------------------------------------
    // Focal phase: auto-advance with fresh random dice values
    // -----------------------------------------------------------------------

    /**
     * Guards against double-dispatch in React StrictMode, where effects fire
     * and are immediately cleaned up and re-fired during development.
     */
    const focalFiredRef = useRef(false);

    useEffect(() => {
        if (state.phase !== 'focal') {
            focalFiredRef.current = false;
            return;
        }
        if (focalFiredRef.current) return;
        focalFiredRef.current = true;
        dispatch({
            type:        'ADVANCE_FOCAL_PHASE',
            dieNewValue: rollD6(),
            extraDieRoll: rollD6(),
        });
    }, [state.phase, state.currentPlayer, dispatch]);

    // -----------------------------------------------------------------------
    // Derived: available actions for the selected hex
    // -----------------------------------------------------------------------

    /**
     * List of action keys that are legal for the currently selected hex.
     * Excludes 'move-tower' if the selected piece is not a tower.
     */
    const availableActions = useMemo(() => {
        if (state.phase !== 'action' || !selectedHex || state.actionTaken) return [];
        if (getController(state, selectedHex) !== state.currentPlayer) return [];

        const actions = [];

        if (
            getTowerSize(state, selectedHex) > 1 &&
            getTowerReachableHexes(state, selectedHex).size > 0
        ) {
            actions.push('move-tower');
        }

        if (getReachableHexes(state, selectedHex).size > 0) {
            actions.push('move-die');
        }

        actions.push('reroll');

        if (canCollapse(state, selectedHex)) {
            actions.push('collapse');
        }

        return actions;
    }, [state, selectedHex]);

    // -----------------------------------------------------------------------
    // Auto-select first applicable action when selection or available actions change
    // -----------------------------------------------------------------------

    useEffect(() => {
        if (availableActions.length === 0) {
            setActiveAction(null);
            return;
        }
        setActiveAction((prev) => {
            if (prev && availableActions.includes(prev)) return prev;
            return ACTION_ORDER.find((a) => availableActions.includes(a)) ?? null;
        });
    }, [availableActions]);

    // -----------------------------------------------------------------------
    // Derived: reachable hexes based on active action
    // -----------------------------------------------------------------------

    /**
     * Set of hex keys that are valid movement destinations for the active action.
     * Empty when the action is not a movement action or nothing is selected.
     */
    const reachableKeys = useMemo(() => {
        if (!selectedHex || state.phase !== 'action' || state.actionTaken) return new Set();
        if (activeAction === 'move-die') {
            // getReachableHexes includes own-die hexes as potential landing spots,
            // but the UI should only treat them as destinations when tower entry
            // is legal (mover value strictly exceeds top die value).
            const moverDie = getTopDie(state, selectedHex);
            const all = getReachableHexes(state, selectedHex);
            const filtered = new Set();
            for (const key of all) {
                const ctrl = getController(state, key);
                if (ctrl === state.currentPlayer && !canEnterTower(state, moverDie, key)) continue;
                filtered.add(key);
            }
            return filtered;
        }
        if (activeAction === 'move-tower') return getTowerReachableHexes(state, selectedHex);
        return new Set();
    }, [state, selectedHex, activeAction]);

    // -----------------------------------------------------------------------
    // Derived: highlighted hexes map passed to Board
    // -----------------------------------------------------------------------

    /** Map of hexKey → highlight type consumed by Board → HexTile. */
    const highlightedHexes = useMemo(() => {
        /** @type {{ [hexKey: string]: string }} */
        const map = {};
        for (const key of reachableKeys) {
            const ctrl = getController(state, key);
            map[key] = ctrl !== null && ctrl !== state.currentPlayer
                ? 'enemy-reachable'
                : 'reachable';
        }
        // 'selected' highlight is handled by Board's isSelected prop → HexTile fill;
        // it is intentionally excluded here so data-highlight is not set for it.
        return map;
    }, [reachableKeys, state]);

    // -----------------------------------------------------------------------
    // Derived: winner
    // -----------------------------------------------------------------------

    /**
     * Player ID of the winner, or null if the game is still ongoing.
     * Victory conditions:
     *  - `phase === 'victory'`: current player just scored the winning point.
     *  - `phase === 'action'` with no action taken and no legal moves: sudden
     *    death; the other player wins.
     */
    const winner = useMemo(() => {
        if (state.phase === 'victory') return state.currentPlayer;
        if (
            state.phase === 'action' &&
            !state.actionTaken &&
            !hasLegalMoves(state)
        ) {
            const idx = state.players.indexOf(state.currentPlayer);
            return state.players[(idx + 1) % state.players.length];
        }
        return null;
    }, [state]);

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    /**
     * Clears the current hex selection and resets the active action.
     *
     * @returns {void}
     */
    function deselect() {
        setSelectedHex(null);
        setActiveAction(null);
    }

    // -----------------------------------------------------------------------
    // Event handlers
    // -----------------------------------------------------------------------

    /**
     * Handles a hex click event delegated from Board.
     * Enforces the select → target → dispatch flow.
     *
     * @param {string} hexKey - Cube-coordinate key of the clicked hex.
     * @returns {void}
     */
    function handleHexClick(hexKey) {
        if (state.phase !== 'action' || winner) return;

        const ctrl  = getController(state, hexKey);
        const isOwn = ctrl === state.currentPlayer;

        // Nothing selected — try to select an own die
        if (!selectedHex) {
            if (isOwn && !state.actionTaken) setSelectedHex(hexKey);
            return;
        }

        // Click the currently selected die → execute in-place action or deselect
        if (hexKey === selectedHex) {
            if (activeAction === 'reroll') {
                dispatch({ type: 'REROLL', hex: hexKey, newValue: rollD6() });
                deselect();
            } else if (activeAction === 'collapse') {
                dispatch({ type: 'COLLAPSE', hex: hexKey });
                deselect();
            } else {
                deselect();
            }
            return;
        }

        // Click a reachable hex — dispatch the appropriate movement action
        if (reachableKeys.has(hexKey)) {
            if (activeAction === 'move-die') {
                dispatch({ type: 'MOVE_DIE', fromHex: selectedHex, toHex: hexKey });
            } else if (activeAction === 'move-tower') {
                dispatch({ type: 'MOVE_TOWER', fromHex: selectedHex, toHex: hexKey });
            }
            deselect();
            return;
        }

        // Click another own die — switch selection
        if (isOwn && !state.actionTaken) {
            setSelectedHex(hexKey);
            return;
        }

        deselect();
    }

    /**
     * Handles a combat option chosen in CombatOverlay.
     *
     * @param {'push'|'occupy'} option - The chosen combat action.
     * @returns {void}
     */
    function handleCombatChoose(option) {
        dispatch({ type: 'CHOOSE_COMBAT_OPTION', option, rerollValue: rollD6() });
    }

    /**
     * Ends the current player's turn after their action is complete.
     *
     * @returns {void}
     */
    function handleEndTurn() {
        dispatch({ type: 'END_TURN' });
        deselect();
    }

    /**
     * Resets the game by reloading the page (full state re-initialisation).
     *
     * @returns {void}
     */
    function handleNewGame() {
        window.location.reload();
    }

    // -----------------------------------------------------------------------
    // Render helpers
    // -----------------------------------------------------------------------

    const combatOptions    = state.phase === 'combat' ? getAvailableCombatOptions(state) : [];
    const canEndTurn       = state.phase === 'action' && state.actionTaken;
    const showActionPanel  = state.phase === 'action' && selectedHex !== null && !state.actionTaken;

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    return (
        <div
            style={{
                position:      'relative',
                minHeight:     '100vh',
                display:       'flex',
                flexDirection: 'column',
                alignItems:    'center',
                padding:       '1.5rem 1rem',
                gap:           '0.75rem',
                background:    'var(--color-bg, #0f172a)',
                color:         'var(--color-text, #f1f5f9)',
                boxSizing:     'border-box',
            }}
        >
            {/* ── Header ──────────────────────────────────────────── */}
            <div
                style={{
                    display:        'flex',
                    alignItems:     'center',
                    gap:            '0.75rem',
                    width:          '100%',
                    justifyContent: 'center',
                }}
            >
                <h1
                    style={{
                        fontSize:   '1.75rem',
                        fontWeight: 700,
                        margin:     0,
                        color:      'var(--color-title, #f8fafc)',
                    }}
                >
                    Donjon Fall
                </h1>
                <button
                    aria-label="Open rules"
                    onClick={() => setShowRules(true)}
                    style={{
                        background:   'transparent',
                        border:       '1px solid var(--color-panel-border, #475569)',
                        borderRadius: '999px',
                        color:        'var(--color-panel-text, #f1f5f9)',
                        cursor:       'pointer',
                        fontSize:     '0.85rem',
                        padding:      '0.2rem 0.6rem',
                    }}
                >
                    ?
                </button>
            </div>

            {/* ── Status bar ──────────────────────────────────────── */}
            <div
                style={{
                    display:        'flex',
                    gap:            '0.75rem',
                    alignItems:     'center',
                    flexWrap:       'wrap',
                    justifyContent: 'center',
                }}
            >
                <ScoreBoard players={state.players} scores={state.scores} />
                <PhaseIndicator phase={state.phase} currentPlayer={state.currentPlayer} />
            </div>

            {/* ── Board (with combat overlay) ─────────────────────── */}
            <div style={{ position: 'relative' }}>
                <Board
                    state={state}
                    selectedHex={selectedHex}
                    highlightedHexes={highlightedHexes}
                    onHexClick={handleHexClick}
                />

                {state.phase === 'combat' && (
                    <CombatOverlay
                        state={state}
                        options={combatOptions}
                        onChoose={handleCombatChoose}
                    />
                )}
            </div>

            {/* ── Action panel ────────────────────────────────────── */}
            {showActionPanel && (
                <ActionPanel
                    currentPlayer={state.currentPlayer}
                    availableActions={availableActions}
                    activeAction={activeAction}
                    onActionSelect={setActiveAction}
                />
            )}

            {/* ── End turn button ──────────────────────────────────── */}
            {canEndTurn && (
                <button
                    onClick={handleEndTurn}
                    style={{
                        background:   'var(--color-panel-bg, #1e293b)',
                        border:       '2px solid var(--color-panel-border, #475569)',
                        borderRadius: '0.5rem',
                        color:        'var(--color-panel-text, #f1f5f9)',
                        cursor:       'pointer',
                        fontSize:     '1rem',
                        fontWeight:   600,
                        padding:      '0.6rem 1.5rem',
                    }}
                >
                    End Turn
                </button>
            )}

            {/* ── Victory screen ──────────────────────────────────── */}
            {winner && (
                <VictoryScreen winner={winner} onNewGame={handleNewGame} />
            )}

            {/* ── Rules viewer ────────────────────────────────────── */}
            {showRules && (
                <RulesViewer onClose={() => setShowRules(false)} />
            )}
        </div>
    );
}
