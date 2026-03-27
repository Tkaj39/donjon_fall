/**
 * Phase 2 — React hook for managing game state and exposing bound selectors.
 */

import { useReducer, useCallback } from 'react';
import { gameReducer } from '../game/gameReducer.js';
import { createInitialState } from '../game/gameState.js';
import {
  getDiceAt,
  getTopDie,
  getController,
  getTowerSize,
  getAttackStrength,
  canEnterTower,
  isFocalPointActive,
  getActiveFocalPoints,
} from '../game/gameState.js';
import {
  getReachableHexes,
  getJumpReachableHexes,
  getTowerReachableHexes,
  getJumpRange,
  getTowerMoveRange,
  canCollapse,
  getApproachDirections,
} from '../game/movement.js';
import { canAttack, getAvailableCombatOptions, canPush } from '../game/combat.js';
import { hasLegalMoves } from '../game/turnManager.js';

/**
 * React hook that holds the full game state and exposes dispatch + convenience selectors.
 *
 * @param {string[]} players - Ordered list of player IDs, e.g. ['red', 'blue']
 * @param {import('../hex/fieldProperties.js').HexField[]} boardFields - Board field definitions
 * @returns {{
 *   state: import('../game/gameState.js').GameState,
 *   dispatch: Function,
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
export function useGameState(players, boardFields) {
  const [state, dispatch] = useReducer(
    gameReducer,
    undefined,
    () => createInitialState(players, boardFields)
  );

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
