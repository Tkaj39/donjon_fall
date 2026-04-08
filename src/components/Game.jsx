/**
 * Game component — top-level game orchestrator.
 * Phase 11.3 — Wires useGameState to the board, action panel, combat overlay,
 * victory screen, score board, phase indicator, and rules viewer.
 *
 * Click flow (action phase) — Phase 12.2 two-step trajectory:
 *   1. Click own die                   → select it; reachable hexes highlighted.
 *   2. Click reachable destination         → auto-path trajectory planned; NOT committed.
 *   2a. Click hex adjacent to traj. end   → extend trajectory by one step (manual path).
 *   2b. Click non-adjacent reachable hex  → re-plan auto-path trajectory.
 *   3. Click trajectory destination again → commit move action; deselect.
 *   3b. Click selected die / Escape       → cancel trajectory (keep selection).
 *   (single-click) Click selected die  → execute in-place action (reroll / collapse)
 *                                        or deselect if no in-place action active.
 *
 * Focal phase is auto-advanced with fresh random rolls (no user interaction).
 * Combat phase is handled by CombatOverlay.
 * Victory is detected and shown via VictoryScreen.
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { getAvailableCombatOptions } from "../game/combat.js";
import { getController, getTopDie, getTowerSize, canEnterTower } from "../game/gameState.js";
import {
    getReachableHexes,
    getTowerReachableHexes,
    getTowerMoveRange,
    canCollapse,
    getShortestPathToHex,
    getApproachDirections,
} from "../game/movement.js";
import { hasLegalMoves } from "../game/turnManager.js";
import { BOARD_FIELDS } from "../hex/boardConstants.js";
import { hexFromKey, hexesDistance } from "../hex/hexUtils.js";
import { useGameState } from "../hooks/useGameState.js";
import { ActionPanel } from "./ActionPanel.jsx";
import { ACTION_ORDER } from "./actionConstants.js";
import { Board, MOVE_ANIMATION_MS, SVG_WIDTH } from "./Board.jsx";
import { CombatOverlay } from "./CombatOverlay.jsx";
import { PhaseIndicator } from "./PhaseIndicator.jsx";
import { RulesViewer } from "./RulesViewer.jsx";
import { ScoreBoard } from "./ScoreBoard.jsx";
import { ActionReplay } from "./ActionReplay.jsx";
import { StateInspector } from "./StateInspector.jsx";
import { VictoryScreen } from "./VictoryScreen.jsx";
import { ANIMAL_OPTIONS, SHIELD_BY_PLAYER } from "../styles/themes/default.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Fallback player list used when Game is launched without setup flow. */
const DEFAULT_PLAYERS = ["red", "blue"];

/** Subtle glow colour per player ID — used for the active-player edge indicator. */
const PLAYER_GLOW = {
    red:  "#3b82f6",
    blue: "#ef4444",
};

/** Which edge to show the glow on per player index (0 = bottom/red, 1 = top/blue). */
const PLAYER_GLOW_EDGE = ["bottom", "top"];

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
 *
 * @param {{
 *   players?: string[],
 *   boardFields?: import("../hex/fieldProperties.js").HexField[],
 * }} props
 * @returns {JSX.Element}
 */
export function Game({ players = DEFAULT_PLAYERS, boardFields = BOARD_FIELDS, playerConfigs = [] }) {
    const { state, dispatch, recordedActions, initialState } = useGameState(players, boardFields);

    // -----------------------------------------------------------------------
    // Local UI state
    // -----------------------------------------------------------------------

    /** Hex key of the currently selected die, or null. */
    const [selectedHex, setSelectedHex] = useState(null);

    /**
     * Active action key: "move-die" | "move-tower" | "reroll" | "collapse" | null.
     * Auto-set to the first applicable action when a hex is selected.
     */
    const [activeAction, setActiveAction] = useState(null);

    /** Whether the rules modal is open. */
    const [showRules, setShowRules] = useState(false);

    /** Whether the Phase 14.1 debug overlay is visible (toggled by Ctrl+D). */
    const [debugMode, setDebugMode] = useState(false);

    /**
     * Planned movement trajectory as an ordered array of hexKeys, starting at
     * `selectedHex` and ending at the chosen destination.  Empty array = no
     * trajectory planned yet.  The move is NOT committed until the player
     * confirms by clicking the destination a second time (Phase 12.2).
     */
    const [trajectoryPath, setTrajectoryPath] = useState([]);

    /**
     * Approach direction hexKey chosen via the Phase 12.4 direction picker, or
     * null if the player has not yet hovered a segment.  When null the fallback
     * is the penultimate hex of `trajectoryPath`.
     *
     * Reset to null whenever the trajectory changes so that a fresh hover
     * always overrides the auto-path default.
     */
    const [pickerApproachKey, setPickerApproachKey] = useState(null);

    /**
     * Move that has been queued for animation but not yet committed to the
     * reducer (Phase 12.6).  While non-null the die is shown in-flight on the
     * board and hex clicks are blocked.  The MOVE_DIE / MOVE_TOWER action is
     * dispatched after MOVE_ANIMATION_MS.
     *
     * @type {{ fromKey: string, toKey: string, actionType: string, approachDirection: string|null } | null}
     */
    const [pendingMove, setPendingMove] = useState(null);

    // -----------------------------------------------------------------------
    // Focal phase: auto-advance with fresh random dice values
    // -----------------------------------------------------------------------

    /**
     * Guards against double-dispatch in React StrictMode, where effects fire
     * and are immediately cleaned up and re-fired during development.
     */
    const focalFiredRef = useRef(false);

    /** Guards against double-dispatch for the auto-end-turn effect. */
    const endTurnFiredRef = useRef(false);

    // -----------------------------------------------------------------------
    // Auto-end turn: when action is taken and no combat is pending, advance
    // -----------------------------------------------------------------------

    useEffect(() => {
        if (state.phase !== "action" || !state.actionTaken || state.combat !== null) {
            endTurnFiredRef.current = false;
            return;
        }
        if (endTurnFiredRef.current) return;
        endTurnFiredRef.current = true;
        dispatch({ type: "CONFIRM_ACTION" });
    }, [state.phase, state.actionTaken, state.combat, dispatch]);

    useEffect(() => {
        if (state.phase !== "focal") {
            focalFiredRef.current = false;
            return;
        }
        if (focalFiredRef.current) return;
        focalFiredRef.current = true;
        dispatch({
            type:        "ADVANCE_FOCAL_PHASE",
            dieNewValue: rollD6(),
            extraDieRoll: rollD6(),
        });
    }, [state.phase, state.currentPlayer, dispatch]);

    // -----------------------------------------------------------------------
    // 12.1 — Escape key: cancel trajectory (keep selection) or deselect
    // -----------------------------------------------------------------------

    useEffect(() => {
        /**
         * Handles keydown events; cancels trajectory or deselects piece on Escape.
         *
         * @param {KeyboardEvent} e
         * @returns {void}
         */
        function handleKeyDown(e) {
            if (e.key === "F2") {
                e.preventDefault();
                setDebugMode(prev => !prev);
                return;
            }
            if (e.key !== "Escape") return;
            setTrajectoryPath((prev) => {
                if (prev.length > 0) return []; // cancel trajectory only
                // No trajectory — deselect piece
                setSelectedHex(null);
                setActiveAction(null);
                return [];
            });
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []); // setters are stable; no external values read

    // -----------------------------------------------------------------------
    // 12.6 — Dispatch queued movement action after animation completes
    // -----------------------------------------------------------------------

    useEffect(() => {
        if (!pendingMove) return;
        const id = setTimeout(() => {
            dispatch({
                type:              pendingMove.actionType,
                fromHex:           pendingMove.fromKey,
                toHex:             pendingMove.toKey,
                approachDirection: pendingMove.approachDirection,
            });
            setPendingMove(null);
        }, MOVE_ANIMATION_MS);
        return () => clearTimeout(id);
    }, [pendingMove, dispatch]);

    // -----------------------------------------------------------------------
    // 12.2 — Wrap ActionPanel"s onActionSelect to clear trajectory on switch
    // -----------------------------------------------------------------------

    /**
     * Handles an action selection from ActionPanel.
     * Clears any planned trajectory so stale path highlights are removed when
     * the player switches to a different action.
     *
     * @param {string} action - The action key chosen (e.g. "move-die", "reroll").
     * @returns {void}
     */
    function handleActionSelect(action) {
        setActiveAction(action);
        setTrajectoryPath([]);
    }

    // -----------------------------------------------------------------------
    // Derived: available actions for the selected hex
    // -----------------------------------------------------------------------

    /**
     * List of action keys that are legal for the currently selected hex.
     * Excludes "move-tower" if the selected piece is not a tower.
     */
    const availableActions = useMemo(() => {
        if (state.phase !== "action" || !selectedHex || state.actionTaken) return [];
        if (getController(state, selectedHex) !== state.currentPlayer) return [];

        const actions = [];

        if (
            getTowerSize(state, selectedHex) > 1 &&
            getTowerReachableHexes(state, selectedHex).size > 0
        ) {
            actions.push("move-tower");
        }

        if (getReachableHexes(state, selectedHex).size > 0) {
            actions.push("move-die");
        }

        actions.push("reroll");

        if (canCollapse(state, selectedHex)) {
            actions.push("collapse");
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
        if (!selectedHex || state.phase !== "action" || state.actionTaken) return new Set();
        if (activeAction === "move-die") {
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
        if (activeAction === "move-tower") return getTowerReachableHexes(state, selectedHex);
        return new Set();
    }, [state, selectedHex, activeAction]);

    // -----------------------------------------------------------------------
    // Derived: Phase 12.4 direction picker data
    // -----------------------------------------------------------------------

    /**
     * The hexKey of the trajectory destination if it is:
     *  - enemy-occupied, AND
     *  - reachable from more than one approach direction.
     * Null otherwise (picker is not shown).
     */
    const pickerEnemyKey = useMemo(() => {
        if (!selectedHex || trajectoryPath.length === 0) return null;
        const dest = trajectoryPath[trajectoryPath.length - 1];
        const ctrl = getController(state, dest);
        if (ctrl === null || ctrl === state.currentPlayer) return null;
        const dirs = getApproachDirections(state, selectedHex, dest);
        return dirs.size > 1 ? dest : null;
    }, [selectedHex, trajectoryPath, state]);

    /**
     * Set of valid approach hexKeys for the picker enemy hex.
     * Empty when the picker is not active.
     */
    const pickerApproachDirs = useMemo(() => {
        if (!pickerEnemyKey || !selectedHex) return new Set();
        return getApproachDirections(state, selectedHex, pickerEnemyKey);
    }, [pickerEnemyKey, selectedHex, state]);

    /**
     * The effective approach direction for the current trajectory:
     *  - Picker hover selection takes priority.
     *  - Falls back to the penultimate hex of the trajectory path (auto-path direction).
     */
    const effectiveApproachKey = pickerApproachKey ??
        (trajectoryPath.length >= 2 ? trajectoryPath[trajectoryPath.length - 2] : null);

    // -----------------------------------------------------------------------
    // Derived: highlighted hexes map passed to Board
    // -----------------------------------------------------------------------

    /**
     * Map of hexKey → highlight type consumed by Board → HexTile.
     *
     * When a trajectory is planned:
     *  - All reachable hexes are shown first (reachable / enemy-reachable).
     *  - Trajectory path hexes (excluding selectedHex) are overlaid as "trajectory",
     *    making the planned path clearly distinct.
     */
    const highlightedHexes = useMemo(() => {
        /** @type {{ [hexKey: string]: string }} */
        const map = {};

        // Base layer — all reachable destinations
        for (const key of reachableKeys) {
            const ctrl = getController(state, key);
            map[key] = ctrl !== null && ctrl !== state.currentPlayer
                ? "enemy-reachable"
                : "reachable";
        }

        // Overlay — planned trajectory path (takes visual priority over base layer)
        for (const key of trajectoryPath.slice(1)) {
            map[key] = "trajectory";
        }

        return map;
    }, [reachableKeys, state, trajectoryPath]);

    // -----------------------------------------------------------------------
    // Derived: winner
    // -----------------------------------------------------------------------

    /**
     * Player ID of the winner, or null if the game is still ongoing.
     * Victory conditions:
     *  - `phase === "victory"`: current player just scored the winning point.
     *  - `phase === "action"` with no action taken and no legal moves: sudden
     *    death; the other player wins.
     */
    const winner = useMemo(() => {
        if (state.phase === "victory") return state.currentPlayer;
        if (
            state.phase === "action" &&
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
        setTrajectoryPath([]);
        setPickerApproachKey(null);
    }

    // -----------------------------------------------------------------------
    // Event handlers
    // -----------------------------------------------------------------------

    /**
     * Handles a hex click event delegated from Board.
     *
     * Phase 12.2 — two-step trajectory flow for movement actions:
     *   Step 1 (no trajectory): click any reachable hex → auto-path trajectory set.
     *   Step 1 (manual extend): click a hex adjacent to the trajectory end that has
     *     remaining steps available → trajectory extended by one step.
     *   Step 1 (re-plan):       click a non-adjacent reachable hex → auto-path replanned.
     *   Step 2 (commit):        click the current trajectory destination again → move dispatched.
     *   Step 2 (attack chain):  click an enemy adjacent to trajectory end → extend to enemy,
     *     then confirm on that enemy; approach direction = former trajectory end.
     *
     * In-place actions (reroll / collapse) remain single-click.
     *
     * @param {string} clickedKey - Cube-coordinate key of the clicked hex.
     * @returns {void}
     */
    function handleHexClick(clickedKey) {
        if (state.phase !== "action" || winner || pendingMove) return;

        const ctrl  = getController(state, clickedKey);
        const isOwn = ctrl === state.currentPlayer;

        // ── Nothing selected — try to select an own die ───────────────────
        if (!selectedHex) {
            if (isOwn && !state.actionTaken) setSelectedHex(clickedKey);
            return;
        }

        // ── Click the currently selected die ─────────────────────────────
        if (clickedKey === selectedHex) {
            if (trajectoryPath.length > 0) {
                // Cancel trajectory but keep piece selected
                setTrajectoryPath([]);
                setPickerApproachKey(null);
            } else if (activeAction === "reroll") {
                dispatch({ type: "REROLL", hex: clickedKey, newValue: rollD6() });
                deselect();
            } else if (activeAction === "collapse") {
                dispatch({ type: "COLLAPSE", hex: clickedKey });
                deselect();
            } else {
                deselect();
            }
            return;
        }

        // ── Movement actions — two-step trajectory flow ───────────────────
        if (
            (activeAction === "move-die" || activeAction === "move-tower") &&
            !state.actionTaken &&
            reachableKeys.has(clickedKey)
        ) {
            const trajectoryDest = trajectoryPath.length > 0
                ? trajectoryPath[trajectoryPath.length - 1]
                : null;

            if (clickedKey === trajectoryDest) {
                // ── Step 2: second click on planned destination — commit ───
                // Queue as a pending animation (Phase 12.6); the reducer fires
                // after MOVE_ANIMATION_MS once the die reaches its destination.
                const actionType = activeAction === "move-die" ? "MOVE_DIE" : "MOVE_TOWER";
                setPendingMove({
                    fromKey:          selectedHex,
                    toKey:            clickedKey,
                    actionType,
                    approachDirection: effectiveApproachKey,
                });
                deselect();
            } else {
                // ── Step 1: plan or extend trajectory ────────────────────
                const trajectoryEnd = trajectoryPath.length > 0
                    ? trajectoryPath[trajectoryPath.length - 1]
                    : null;

                const moveRange = activeAction === "move-tower"
                    ? getTowerMoveRange(state, selectedHex)
                    : (getTopDie(state, selectedHex)?.value ?? 0);
                const stepsUsed      = trajectoryPath.length > 0 ? trajectoryPath.length - 1 : 0;
                const remainingSteps = moveRange - stepsUsed;

                const isAdjacentToEnd = trajectoryEnd !== null &&
                    hexesDistance(hexFromKey(trajectoryEnd), hexFromKey(clickedKey)) === 1;
                const notInPath = !trajectoryPath.includes(clickedKey);

                if (isAdjacentToEnd && remainingSteps > 0 && notInPath) {
                    // Manual one-step extension — covers both the ordinary extend
                    // case and the "click enemy adjacent to destination" case from
                    // the spec (the extended enemy becomes the new trajectory dest).
                    setTrajectoryPath([...trajectoryPath, clickedKey]);
                    setPickerApproachKey(null);
                } else {
                    // Auto-path re-plan to a non-adjacent (or first) destination
                    const path = getShortestPathToHex(state, selectedHex, clickedKey, activeAction);
                    if (path.length > 0) {
                        setTrajectoryPath(path);
                        setPickerApproachKey(null);
                    }
                }
            }
            return;
        }

        // ── Click another own die — switch selection ──────────────────────
        if (isOwn && !state.actionTaken) {
            setSelectedHex(clickedKey);
            setTrajectoryPath([]);
            setPickerApproachKey(null);
            return;
        }

        deselect();
    }

    /**
     * Handles a combat option chosen in CombatOverlay.
     *
     * @param {"push"|"occupy"} option - The chosen combat action.
     * @returns {void}
     */
    function handleCombatChoose(option) {
        dispatch({ type: "CHOOSE_COMBAT_OPTION", option, rerollValue: rollD6() });
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

    const combatOptions    = state.phase === "combat" ? getAvailableCombatOptions(state) : [];
    const showActionPanel  = state.phase === "action" && selectedHex !== null && !state.actionTaken;

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    return (
        <div
            className="relative h-dvh flex flex-col bg-stone-900/60 text-[var(--color-text,#f1f5f9)] box-border overflow-hidden"
        >
            {/* ── Active player edge glow ─────────────────────── */}
            {(() => {
                const idx   = state.players.indexOf(state.currentPlayer);
                const edge  = PLAYER_GLOW_EDGE[idx] ?? "bottom";
                const color = PLAYER_GLOW[state.currentPlayer] ?? "#94a3b8";
                const grad  = edge === "top"
                    ? `linear-gradient(to bottom, ${color}, transparent)`
                    : `linear-gradient(to top,    ${color}, transparent)`;
                return (
                    <div
                        aria-hidden="true"
                        className="pointer-events-none fixed left-0 right-0 transition-all duration-500"
                        style={{
                            [edge]: 0,
                            height: 200,
                            background: grad,
                            opacity: 0.55,
                            zIndex: -1,
                        }}
                    />
                );
            })()}
            {/* ── Header ──────────────────────────────────────────── */}
            <header className="flex items-center justify-between px-4 py-2 shrink-0">
                <h1 className="text-base font-bold tracking-wide text-stone-100 m-0">
                    Pád donjonu
                </h1>
                <button
                    aria-label="Open rules"
                    onClick={() => setShowRules(true)}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-stone-600 text-stone-300 hover:text-white hover:border-stone-400 transition-colors text-sm"
                >
                    ?
                </button>
                {debugMode && (
                    <span className="text-[0.75rem] font-mono bg-yellow-400 text-black rounded px-2 py-[0.1rem] select-none">
                        DEBUG
                    </span>
                )}
            </header>

            {/* ── Debug state summary (Phase 14.1) ────────────────── */}
            {debugMode && (
                <div className="font-mono text-[0.72rem] bg-black/60 border border-yellow-400/40 rounded px-3 py-1 text-yellow-200 w-full text-center">
                    {`player: ${state.currentPlayer}  |  phase: ${state.phase}  |  actionTaken: ${state.actionTaken}`}
                </div>
            )}

            {/* ── State inspector (Phase 14.2) ─────────────────────── */}
            {debugMode && <StateInspector state={state} />}

            {/* ── Action replay (Phase 14.3) ───────────────────────── */}
            {debugMode && (
                <ActionReplay
                    actions={recordedActions}
                    initialState={initialState}
                />
            )}

            {/* ── Status bar ──────────────────────────────────────── */}
            <div className="flex gap-3 items-center flex-wrap justify-center">
                <ScoreBoard players={state.players} scores={state.scores} />
                <PhaseIndicator phase={state.phase} currentPlayer={state.currentPlayer} />
            </div>

            {/* ── Board area + side shields ────────────────────── */}
            <div className="flex-1 min-h-0 flex items-center justify-center px-2 py-1">

                {/* Three-column: left shield | board | right shield */}
                <div className="flex items-center gap-2 h-full">

                    {state.players.map((playerId, idx) => {
                        const cfg        = playerConfigs.find(c => c.id === playerId);
                        const score      = state.scores[playerId] ?? 0;
                        const shieldHref = SHIELD_BY_PLAYER[playerId] ?? SHIELD_BY_PLAYER.blue;
                        const animalHref = ANIMAL_OPTIONS.find(a => a.id === cfg?.coatOfArms)?.href ?? ANIMAL_OPTIONS[0].href;
                        const isActive   = state.currentPlayer === playerId;

                        const shield = (
                            <div key={playerId} className="flex flex-col items-center gap-1 shrink-0">
                                <div className="relative w-28 h-28">
                                    <img src={shieldHref} alt="" className="w-full h-full object-contain" />
                                    <img src={animalHref} alt={cfg?.coatOfArms ?? ""} className="absolute inset-0 w-full h-full object-contain p-1" />
                                    <span className={[
                                        "absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs font-bold leading-none px-1.5 py-0.5 rounded-full",
                                        isActive ? "bg-amber-400 text-stone-900" : "bg-stone-700 text-stone-200",
                                    ].join(" ")}>
                                        {score}
                                    </span>
                                </div>
                                <p className="text-xs font-semibold text-stone-100 text-center leading-tight max-w-[7rem] truncate">
                                    {cfg?.name || playerId}
                                </p>
                            </div>
                        );

                        if (idx === 0) return <>{shield}<div key="board" className="relative h-full" style={{ width: SVG_WIDTH }}>
                    <Board
                    state={state}
                    selectedHex={selectedHex}
                    highlightedHexes={highlightedHexes}
                    pendingMove={pendingMove}
                    debugMode={debugMode}
                    pickerData={pickerEnemyKey ? {
                        enemyKey:           pickerEnemyKey,
                        approachDirs:       pickerApproachDirs,
                        selectedApproachKey: effectiveApproachKey,
                        onApproachHover:    setPickerApproachKey,
                    } : null}
                    onHexClick={handleHexClick}
                />
                {state.phase === "combat" && (
                    <CombatOverlay
                        state={state}
                        options={combatOptions}
                        onChoose={handleCombatChoose}
                    />
                )}
                </div></>;
                        return shield;
                    })}

                </div>
            </div>{/* end flex-1 scroll area */}

            {/* ── Action panel + End turn ──────────────────────── */}
            <div className="flex flex-col items-center gap-2 shrink-0 pb-4 px-4">
                <div style={{ visibility: showActionPanel ? "visible" : "hidden" }}>
                    <ActionPanel
                        currentPlayer={state.currentPlayer}
                        availableActions={availableActions}
                        activeAction={activeAction}
                        onActionSelect={handleActionSelect}
                    />
                </div>

            </div>

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
