/**
 * Phase 2 — React hook for managing game state and exposing bound selectors.
 */

import { useReducer, useCallback, useState } from "react";
import { gameReducer } from "../game/gameReducer.js";

// ---------------------------------------------------------------------------
// Recording reducer wrapper (Phase 14.3)
// ---------------------------------------------------------------------------

/**
 * Wraps `gameReducer` to accumulate every dispatched action in an array stored
 * alongside the game state.  The wrapper is kept here so that the `dispatch`
 * identity returned to callers is always the original `useReducer` dispatch —
 * avoiding any side-effects on dependency arrays in Game.jsx effects.
 *
 * The outer state shape is `{ game: GameState, actions: Action[] }`.
 * `useGameState` unwraps the two parts before returning them to the caller.
 *
 * @param {{ game: import("../game/gameState.js").GameState, actions: Array<object> }} state
 * @param {{ type: string, [key: string]: unknown }} action
 * @returns {{ game: import("../game/gameState.js").GameState, actions: Array<object> }}
 */
function recordingReducer(state, action) {
    return {
        game:    gameReducer(state.game, action),
        actions: [...state.actions, action],
    };
}
import { createInitialState } from "../game/gameState.js";
import {
  getDiceAt,
  getTopDie,
  getController,
  getTowerSize,
  getAttackStrength,
  canEnterTower,
  isFocalPointActive,
  getActiveFocalPoints,
} from "../game/gameState.js";
import {
  getReachableHexes,
  getJumpReachableHexes,
  getTowerReachableHexes,
  getJumpRange,
  getTowerMoveRange,
  canCollapse,
  getApproachDirections,
} from "../game/movement.js";
import { canAttack, getAvailableCombatOptions, canPush } from "../game/combat.js";
import { hasLegalMoves } from "../game/turnManager.js";

/**
 * React hook that holds the full game state and exposes dispatch + convenience selectors.
 *
 * @param {string[]} players - Ordered list of player IDs, e.g. ["red", "blue"]
 * @param {import("../hex/fieldProperties.js").HexField[]} boardFields - Board field definitions
 * @returns {{
 *   state: import("../game/gameState.js").GameState,
 *   dispatch: Function,
 *   recordedActions: Array<{ type: string, [key: string]: unknown }>,
 *   initialState: import("../game/gameState.js").GameState,
 *   getDiceAt: Function,
 *   getTopDie: Function,
 *   getController: Function,
 *   getTowerSize: Function,
 *   getAttackStrength: Function,
 *   canEnterTower: Function,
 *   isFocalPointActive: Function,
 *   getActiveFocalPoints: Function,
 *   getReachableHexes: Function,
 *   getJumpReachableHexes: Function,
 *   getTowerReachableHexes: Function,
 *   getJumpRange: Function,
 *   getTowerMoveRange: Function,
 *   canCollapse: Function,
 *   getApproachDirections: Function,
 *   canAttack: Function,
 *   getAvailableCombatOptions: Function,
 *   canPush: Function,
 *   hasLegalMoves: Function,
 * }}
 */
export function useGameState(players, boardFields, firstPlayer = null) {
  const [combined, dispatch] = useReducer(
    recordingReducer,
    undefined,
    () => ({ game: createInitialState(players, boardFields, firstPlayer), actions: [] }),
  );

  const state = combined.game;
  const recordedActions = combined.actions;

  /**
   * Snapshot of the initial game state, captured once at mount.
   * Used by ActionReplay (Phase 14.3) as the deterministic replay baseline.
   */
  const [initialState] = useState(() => createInitialState(players, boardFields, firstPlayer));

  /**
   * Creates a bound version of a selector function that pre-applies the current state.
   *
   * @param {Function} fn - A selector function that takes state as its first argument
   * @returns {Function} A new function that accepts remaining args and calls fn with state
   */
  const bound = useCallback(
    (fn) =>
      (...args) =>
        fn(state, ...args),
    [state]
  );

  return {
    state,
    dispatch,
    recordedActions,
    initialState,
    getDiceAt: bound(getDiceAt),
    getTopDie: bound(getTopDie),
    getController: bound(getController),
    getTowerSize: bound(getTowerSize),
    getAttackStrength: bound(getAttackStrength),
    canEnterTower: bound(canEnterTower),
    isFocalPointActive: bound(isFocalPointActive),
    getActiveFocalPoints: bound(getActiveFocalPoints),
    getReachableHexes: bound(getReachableHexes),
    getJumpReachableHexes: bound(getJumpReachableHexes),
    getTowerReachableHexes: bound(getTowerReachableHexes),
    getJumpRange: bound(getJumpRange),
    getTowerMoveRange: bound(getTowerMoveRange),
    canCollapse: bound(canCollapse),
    getApproachDirections: bound(getApproachDirections),
    canAttack: bound(canAttack),
    getAvailableCombatOptions: bound(getAvailableCombatOptions),
    canPush: bound(canPush),
    hasLegalMoves: bound(hasLegalMoves),
  };
}
