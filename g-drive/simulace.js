// ═══════════════════════════════════════════════════════════════
// PÁD DONJONU — Automatický simulátor her (bot vs bot)
// Spouštění: node simulace.js [počet_her]
// ═══════════════════════════════════════════════════════════════

const fs = require("fs");
const vm = require("vm");

// ── Načtení game.js do sandboxu ─────────────────────────────

let gameSource = fs.readFileSync(__dirname + "/src/game.js", "utf-8");
gameSource = gameSource.replace(/\bconst\b/g, "var").replace(/\blet\b/g, "var");
gameSource = gameSource.replace(/^class\s+(\w+)/gm, "var $1 = class $1");

const sandbox = {
  console, Math, Map, Set, Object, Array, JSON,
  parseInt, parseFloat, isNaN, isFinite,
  undefined, Infinity, NaN,
};
vm.createContext(sandbox);
vm.runInContext(gameSource, sandbox);

const {
  Player, DiceType, HexMap, GameState, WINNING_SCORE,
  hexKey, hexEquals, hexDistance, hexNeighbor,
  createDie, createDieWithValue, rerollDie, dieMaxValue, dieDestructionPoints,
  isTower, topDie, bottomDie, formationAttackStrength, towerReach, towerDominance,
  hasDominance, isMixedFormation, playerDice, opponentDice, opponent,
  findValidMoves, findValidTargets, executeMove,
  combatPhase1, combatDisplace, combatOccupy, resolveCombat,
  findTowerMoveTargets, executeTowerMove,
  findTowerJumpTargets, executeTowerJump,
  findEscapeTargets, executeEscape,
  executeReform,
  findCollapsibleTowers, executeCollapse,
  FOCAL_POINTS,
} = sandbox;

// ═══════════════════════════════════════════════════════════════
// HEURISTICKÝ BOT
// ═══════════════════════════════════════════════════════════════
//
// Strategie:
//  - Ohodnotí všechny legální akce
//  - Vybere akci s nejvyšším skóre (+ malý random pro variabilitu)
//  - Preference: ohniska > útok > kolaps > skok > pohyb > reform
//
// ═══════════════════════════════════════════════════════════════

/**
 * Vrátí všechny legální akce pro daného hráče.
 * Každá akce: { type, score, execute: () => result }
 */
function findAllActions(gs, player) {
  const actions = [];
  const myDice = gs.getPlayerDice(player);

  // ── 1) POHYB KOSTKOU ──────────────────────────────────────

  for (const die of myDice) {
    const formation = gs.getFormation(die.position);
    // Kostka musí být navrchu nebo sama
    if (formation.length > 1 && topDie(formation) !== die) continue;

    const targets = findValidTargets(gs, die);
    for (const move of targets) {
      const score = scoreMove(gs, die, move, player);
      actions.push({
        type: move.isAttack ? "attack" : "move",
        desc: `Pohyb ${die.id}(${die.value}) → [${move.target.q},${move.target.r}]${move.isAttack ? " ÚTOK" : ""}`,
        score,
        execute: () => executeMoveAction(gs, die, move, player),
      });
    }
  }

  // ── 2) POHYB VĚŽE ─────────────────────────────────────────

  const towerFields = findPlayerTowers(gs, player);
  for (const tCoord of towerFields) {
    const result = findTowerMoveTargets(gs, tCoord, player);
    if (result.reason) continue;
    for (const t of result.targets) {
      const score = scoreTowerMove(gs, tCoord, t, player);
      actions.push({
        type: t.isAttack ? "tower_attack" : "tower_move",
        desc: `Věž [${tCoord.q},${tCoord.r}] → [${t.target.q},${t.target.r}]${t.isAttack ? " ÚTOK" : ""}`,
        score,
        execute: () => executeTowerMoveAction(gs, tCoord, t, player),
      });
    }
  }

  // ── 3) SKOK Z VĚŽE ────────────────────────────────────────

  for (const tCoord of towerFields) {
    const result = findTowerJumpTargets(gs, tCoord, player);
    if (result.reason) continue;
    for (const t of result.targets) {
      const score = scoreJump(gs, tCoord, t, player);
      actions.push({
        type: t.isAttack ? "jump_attack" : "jump",
        desc: `Skok [${tCoord.q},${tCoord.r}] → [${t.target.q},${t.target.r}]${t.isAttack ? " ÚTOK" : ""}`,
        score,
        execute: () => executeJumpAction(gs, tCoord, t, player),
      });
    }
  }

  // ── 4) ÚTĚK Z VĚŽE ────────────────────────────────────────
  // Escape: hráčova kostka je na VRCHOLU smíšené věže (nemusí dominovat)

  const allMixedTowers = findMixedTowersWithPlayerOnTop(gs, player);
  for (const tCoord of allMixedTowers) {
    const result = findEscapeTargets(gs, tCoord, player);
    if (!result.targets || result.targets.length === 0) continue;
    for (const target of result.targets) {
      const score = scoreEscape(gs, tCoord, target, result, player);
      actions.push({
        type: "escape",
        desc: `Útěk [${tCoord.q},${tCoord.r}] → [${target.q},${target.r}]`,
        score,
        execute: () => executeEscape(gs, tCoord, target, player),
      });
    }
  }

  // ── 5) KOLAPS VĚŽE ────────────────────────────────────────

  const collapsible = findCollapsibleTowers(gs, player);
  for (const tower of collapsible.towers) {
    const score = scoreCollapse(tower, player);
    actions.push({
      type: "collapse",
      desc: `Kolaps [${tower.coord.q},${tower.coord.r}] → odstraní ${tower.bottomDie.owner} ${tower.bottomDie.value}`,
      score,
      execute: () => executeCollapse(gs, tower.coord, player),
    });
  }

  // ── 6) PŘEFORMOVÁNÍ ───────────────────────────────────────
  // Reform je VŽDY legální akce pro jakoukoliv vlastní kostku

  for (const die of myDice) {
    const score = scoreReform(die, player);
    actions.push({
      type: "reform",
      desc: `Přeformování ${die.id}(${die.value})`,
      score,
      execute: () => executeReform(die),
    });
  }

  return actions;
}

// ── Najde pole s věžemi hráče (hráč dominuje) ───────────────

function findPlayerTowers(gs, player) {
  const towers = [];
  for (const [key, formation] of gs.board) {
    if (formation.length < 2) continue;
    if (towerDominance(formation) !== player) continue;
    towers.push(formation[0].position);
  }
  return towers;
}

// ── Najde smíšené věže kde hráč je na vrcholu (pro escape) ──

function findMixedTowersWithPlayerOnTop(gs, player) {
  const towers = [];
  for (const [key, formation] of gs.board) {
    if (formation.length < 2) continue;
    const top = topDie(formation);
    if (top.owner !== player) continue;
    // Musí být smíšená věž (obsahuje soupeřovy kostky)
    const hasEnemy = formation.some(d => d.owner !== player);
    if (!hasEnemy) continue;
    towers.push(formation[0].position);
  }
  return towers;
}

// ═══════════════════════════════════════════════════════════════
// SKÓROVACÍ FUNKCE (heuristika)
// ═══════════════════════════════════════════════════════════════

const FOCAL = FOCAL_POINTS || [{ q: -3, r: 0 }, { q: 0, r: 0 }, { q: +3, r: 0 }];

function isFocalPoint(coord) {
  return FOCAL.some(fp => hexEquals(fp, coord));
}

function distToNearestFocal(coord) {
  return Math.min(...FOCAL.map(fp => hexDistance(coord, fp)));
}

/** Skóre pro pohyb kostkou. */
function scoreMove(gs, die, move, player) {
  let s = 0;

  // Útok → velký bonus
  if (move.isAttack) {
    s += 50;
    // Bonus za sílu převahy
    const defStr = formationAttackStrength(gs.getFormation(move.target), opponent(player));
    s += (die.value - defStr) * 5;
  }

  // Ohniska — velký bonus za obsazení
  if (isFocalPoint(move.target)) s += 80;

  // Blízkost k ohnisku
  const distBefore = distToNearestFocal(die.position);
  const distAfter = distToNearestFocal(move.target);
  s += (distBefore - distAfter) * 8;

  // Penalizace za vzdalování od centra
  s -= hexDistance(move.target, { q: 0, r: 0 }) * 2;

  return s + Math.random() * 5; // malý random pro variabilitu
}

/** Skóre pro pohyb věže. */
function scoreTowerMove(gs, fromCoord, move, player) {
  let s = 10; // base bonus pro věž — je to strategický tah
  if (move.isAttack) s += 60;
  if (isFocalPoint(move.target)) s += 90;
  const distBefore = distToNearestFocal(fromCoord);
  const distAfter = distToNearestFocal(move.target);
  s += (distBefore - distAfter) * 10;
  return s + Math.random() * 5;
}

/** Skóre pro skok. */
function scoreJump(gs, fromCoord, move, player) {
  let s = 5;
  if (move.isAttack) s += 55;
  if (isFocalPoint(move.target)) s += 85;
  const distBefore = distToNearestFocal(fromCoord);
  const distAfter = distToNearestFocal(move.target);
  s += (distBefore - distAfter) * 8;
  return s + Math.random() * 5;
}

/** Skóre pro útěk. */
function scoreEscape(gs, fromCoord, target, escResult, player) {
  let s = 15; // útěk má smysl, když jsem uvězněn
  if (isFocalPoint(target)) s += 40;
  // Penalizace za ztrátu hodnoty
  s -= escResult.cost * 5;
  return s + Math.random() * 5;
}

/** Skóre pro kolaps. */
function scoreCollapse(tower, player) {
  let s = 0;
  if (tower.bottomDie.owner !== player) {
    s += 40; // zničení soupeřovy kostky = body
    s += tower.bottomDie.value * 2; // vyšší hodnota = strateg. bonus
  } else {
    s -= 10; // zničení vlastní kostky = špatný nápad
  }
  return s + Math.random() * 5;
}

/** Skóre pro přeformování. */
function scoreReform(die, player) {
  let s = -5; // base penalizace — přeformování = žádný pohyb
  // Malé kostky víc profitují → vyšší motivace přeformovat
  s += (7 - die.value) * 3;
  // Kostka s max hodnotou → minimální skóre (fallback)
  if (die.value >= 6) s = -50;
  return s + Math.random() * 5;
}

// ═══════════════════════════════════════════════════════════════
// PROVEDENÍ AKCÍ
// ═══════════════════════════════════════════════════════════════

function executeMoveAction(gs, die, move, player) {
  const result = executeMove(gs, die, move.target);
  if (!result.success) return result;

  if (result.attack) {
    // resolveCombat handles EVERYTHING: phase1 + phase2 (including moving attacker)
    const combat = resolveCombat(gs, die, result.attackerFrom, move.target, "displace");
    return combat;
  }
  return result;
}

function executeTowerMoveAction(gs, tCoord, move, player) {
  const result = executeTowerMove(gs, tCoord, move.target, player);
  if (!result.success) return result;

  if (result.attack) {
    const formation = gs.getFormation(tCoord);
    const wearDie = topDie(formation);
    // combatDisplace moves wearDie (top) to target; we then move the rest
    const combat = resolveCombat(gs, wearDie, tCoord, move.target, "displace", {
      attackStrength: result.attackStrength,
      isTowerAttack: true,
      wearDie,
    });
    if (combat.success) {
      // Move remaining tower members to target (top die already moved by combatDisplace)
      const remaining = [...gs.getFormation(tCoord)];
      for (const d of remaining) gs.moveDie(d, move.target);
    }
    return combat;
  }
  return result;
}

function executeJumpAction(gs, tCoord, move, player) {
  const result = executeTowerJump(gs, tCoord, move.target, player);
  if (!result.success) return result;

  if (result.attack) {
    // jump attack: resolveCombat moves jumpDie to target (displace or occupy)
    const combat = resolveCombat(gs, result.jumpDie, tCoord, move.target, "displace", {
      attackStrength: result.attackStrength,
    });
    return combat;
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════
// HLAVNÍ HERNÍ SMYČKA
// ═══════════════════════════════════════════════════════════════

/**
 * Odehraje jednu kompletní hru bot vs bot.
 * Vrací statistiky a log chyb.
 */
function playGame(gameId, verbose) {
  const gs = new GameState();
  gs.setup();

  const log = [];
  const errors = [];
  const actionCounts = {};
  const perPlayer = {
    red: { actions: {}, attacks: 0, kills: 0, focalMoves: 0, reforms: 0, towerActions: 0 },
    blue: { actions: {}, attacks: 0, kills: 0, focalMoves: 0, reforms: 0, towerActions: 0 },
  };
  let turnCount = 0;
  let winByElimination = false;
  const MAX_TURNS = 500; // bezpečnostní limit

  while (!gs.winner && turnCount < MAX_TURNS) {
    turnCount++;
    const player = gs.turn;

    // Začátek tahu — kontrola výhry
    const turnInfo = gs.startTurn();
    if (turnInfo.winner) break;

    // Kontrola: pokud hráč nemá žádné kostky, automaticky prohrává
    const myDice = gs.getPlayerDice(player);
    if (myDice.length === 0) {
      gs.winner = opponent(player);
      break;
    }

    // Najdi všechny akce
    const actions = findAllActions(gs, player);

    if (actions.length === 0) {
      errors.push({
        turn: turnCount,
        player,
        msg: `ŽÁDNÉ LEGÁLNÍ AKCE (${myDice.length} kostek: ${myDice.map(d => d.id+":"+d.value).join(", ")})`,
        boardState: dumpBoard(gs),
      });
      gs.endTurn();
      continue;
    }

    // Vyber nejlepší akci
    actions.sort((a, b) => b.score - a.score);
    const chosen = actions[0];

    // Logování
    if (verbose || turnCount > MAX_TURNS - 25) {
      log.push(`T${turnCount} ${player}: ${chosen.desc} (score ${chosen.score.toFixed(1)}, z ${actions.length} akcí)`);
    }

    // Sledování typů akcí
    actionCounts[chosen.type] = (actionCounts[chosen.type] || 0) + 1;
    const pp = perPlayer[player];
    pp.actions[chosen.type] = (pp.actions[chosen.type] || 0) + 1;
    if (chosen.type === "reform") pp.reforms++;
    if (["attack","tower_attack","jump_attack"].includes(chosen.type)) pp.attacks++;
    if (["tower_move","tower_attack","collapse"].includes(chosen.type)) pp.towerActions++;
    if (chosen.desc && chosen.desc.includes("★") || (chosen.desc && (chosen.desc.includes("[-3,0]") || chosen.desc.includes("[0,0]") || chosen.desc.includes("[3,0]")))) pp.focalMoves++;

    // Proveď akci
    let result;
    try {
      result = chosen.execute();
    } catch (e) {
      errors.push({
        turn: turnCount,
        player,
        action: chosen.desc,
        msg: "VÝJIMKA: " + e.message,
        stack: e.stack,
        boardState: dumpBoard(gs),
      });
      // Nouzový fallback: přeformuj náhodnou kostku
      const myDice = gs.getPlayerDice(player);
      if (myDice.length > 0) {
        executeReform(myDice[0]);
      }
      gs.endTurn();
      continue;
    }

    if (result && !result.success) {
      errors.push({
        turn: turnCount,
        player,
        action: chosen.desc,
        msg: "SELHÁNÍ: " + (result.reason || "neznámý důvod"),
        boardState: dumpBoard(gs),
      });
      // Fallback: přeformuj
      const myDice = gs.getPlayerDice(player);
      if (myDice.length > 0) {
        executeReform(myDice[0]);
      }
    }

    // Konec tahu
    gs.endTurn();
    if (gs.winner) break;

    // Post-action: zkontroluj, zda obě strany mají alespoň 1 kostku
    for (const p of ["red", "blue"]) {
      if (gs.getPlayerDice(p).length === 0 && !gs.winner) {
        gs.winner = opponent(p);
        winByElimination = true;
      }
    }
    if (gs.winner) break;
  }

  const timedOut = turnCount >= MAX_TURNS && !gs.winner;

  // Diagnostika timeoutů
  let timeoutDiag = null;
  if (timedOut) {
    timeoutDiag = {
      scores: gs.scoreSummary(),
      redDice: gs.getPlayerDice("red").map(d => ({ id: d.id, val: d.value, pos: hexKey(d.position) })),
      blueDice: gs.getPlayerDice("blue").map(d => ({ id: d.id, val: d.value, pos: hexKey(d.position) })),
      lastActions: log.slice(-20),
    };
  }

  return {
    gameId,
    winner: gs.winner,
    turns: turnCount,
    timedOut,
    scores: { red: gs.totalScore("red"), blue: gs.totalScore("blue") },
    destructionScores: { ...gs.scores },
    focalScores: { red: gs.focalPointsControlled("red"), blue: gs.focalPointsControlled("blue") },
    errors,
    log,
    actionCounts,
    perPlayer,
    winByElimination,
    timeoutDiag,
  };
}

// ── Dump board pro debug ─────────────────────────────────────

function dumpBoard(gs) {
  const fields = [];
  for (const [key, formation] of gs.board) {
    if (formation.length === 0) continue;
    fields.push({
      key,
      dice: formation.map(d => `${d.owner[0].toUpperCase()}${d.value}${d.alive ? "" : "†"}`).join(" "),
    });
  }
  return fields;
}

// ═══════════════════════════════════════════════════════════════
// STATISTIKY & REPORTING
// ═══════════════════════════════════════════════════════════════

function runSimulation(numGames, verbose) {
  const RED = "\x1b[31m", GREEN = "\x1b[32m", YELLOW = "\x1b[33m";
  const CYAN = "\x1b[36m", BOLD = "\x1b[1m", RESET = "\x1b[0m";

  console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}  Pád Donjonu — Automatický simulátor (${numGames} her)${RESET}`);
  console.log(`${CYAN}═══════════════════════════════════════════════════════${RESET}\n`);

  let redWins = 0, blueWins = 0, draws = 0, timeouts = 0;
  let totalTurns = 0;
  let totalErrors = 0;
  const allErrors = [];
  const turnCounts = [];
  const actionStats = {};
  const winByElim = { red: 0, blue: 0 };
  let timeoutDiags = null;

  // Strategická analýza
  const strategy = {
    winnerActions: {},
    loserActions: {},
    winnerAttacks: [],
    loserAttacks: [],
    winnerReforms: [],
    loserReforms: [],
    winnerTowerActions: [],
    loserTowerActions: [],
    winnerFocalMoves: [],
    loserFocalMoves: [],
    winByFocal: 0,
    winByDestruction: 0,
    winByMixed: 0,
    fastWins: [],   // < 30 tahů
    slowWins: [],   // > 80 tahů
    winnerDestrScores: [],
    loserDestrScores: [],
    winnerFocalScores: [],
    loserFocalScores: [],
  };

  const startTime = Date.now();

  for (let i = 1; i <= numGames; i++) {
    const result = playGame(i, verbose);

    if (result.timedOut) {
      timeouts++;
      draws++;
    } else if (result.winner === "red") {
      redWins++;
    } else if (result.winner === "blue") {
      blueWins++;
    } else {
      draws++;
    }

    totalTurns += result.turns;
    turnCounts.push(result.turns);
    totalErrors += result.errors.length;

    // Agregace akčních statistik
    for (const [type, count] of Object.entries(result.actionCounts)) {
      actionStats[type] = (actionStats[type] || 0) + count;
    }
    if (result.winByElimination && result.winner) {
      winByElim[result.winner]++;
    }

    // Strategická analýza
    if (result.winner && !result.timedOut) {
      const w = result.winner;
      const l = opponent(w);
      const wp = result.perPlayer[w];
      const lp = result.perPlayer[l];

      // Akce vítěze vs poraženého
      for (const [t, c] of Object.entries(wp.actions)) {
        strategy.winnerActions[t] = (strategy.winnerActions[t] || 0) + c;
      }
      for (const [t, c] of Object.entries(lp.actions)) {
        strategy.loserActions[t] = (strategy.loserActions[t] || 0) + c;
      }

      strategy.winnerAttacks.push(wp.attacks);
      strategy.loserAttacks.push(lp.attacks);
      strategy.winnerReforms.push(wp.reforms);
      strategy.loserReforms.push(lp.reforms);
      strategy.winnerTowerActions.push(wp.towerActions);
      strategy.loserTowerActions.push(lp.towerActions);
      strategy.winnerFocalMoves.push(wp.focalMoves);
      strategy.loserFocalMoves.push(lp.focalMoves);

      // Jak vítěz vyhrál: ohniska vs destrukce
      const wDestr = w === "red" ? result.destructionScores.red : result.destructionScores.blue;
      const wFocal = w === "red" ? result.focalScores.red : result.focalScores.blue;
      const lDestr = l === "red" ? result.destructionScores.red : result.destructionScores.blue;
      const lFocal = l === "red" ? result.focalScores.red : result.focalScores.blue;
      strategy.winnerDestrScores.push(wDestr);
      strategy.loserDestrScores.push(lDestr);
      strategy.winnerFocalScores.push(wFocal);
      strategy.loserFocalScores.push(lFocal);

      if (wFocal >= 3) strategy.winByFocal++;
      else if (wDestr >= 5) strategy.winByDestruction++;
      else strategy.winByMixed++;

      if (result.turns < 30) strategy.fastWins.push({ gameId: i, turns: result.turns, winner: w });
      if (result.turns > 80) strategy.slowWins.push({ gameId: i, turns: result.turns, winner: w });
    }

    if (result.errors.length > 0) {
      allErrors.push(...result.errors.map(e => ({ ...e, gameId: i })));
    }

    // Diagnostika timeoutů
    if (result.timeoutDiag) {
      if (!timeoutDiags) timeoutDiags = [];
      timeoutDiags.push({ gameId: i, ...result.timeoutDiag });
    }

    if (verbose && result.log.length > 0) {
      console.log(`\n${YELLOW}── Hra ${i} ──${RESET}`);
      for (const line of result.log.slice(-10)) console.log("  " + line);
      console.log(`  → Vítěz: ${result.winner || "TIMEOUT"} (${result.turns} tahů)`);
    }

    // Progress bar
    if (!verbose && i % Math.max(1, Math.floor(numGames / 20)) === 0) {
      const pct = ((i / numGames) * 100).toFixed(0);
      process.stdout.write(`\r  Simuluji... ${pct}% (${i}/${numGames})`);
    }
  }

  if (!verbose) process.stdout.write("\r" + " ".repeat(50) + "\r");

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  const avgTurns = (totalTurns / numGames).toFixed(1);
  const medianTurns = turnCounts.sort((a, b) => a - b)[Math.floor(turnCounts.length / 2)];
  const minTurns = Math.min(...turnCounts);
  const maxTurns = Math.max(...turnCounts);

  // ── Výsledky ──

  console.log(`${BOLD}📊 VÝSLEDKY${RESET}`);
  console.log(`${"─".repeat(50)}`);
  console.log(`  ${RED}Červený vyhrál:${RESET}  ${redWins}× (${((redWins/numGames)*100).toFixed(1)}%)`);
  console.log(`  ${CYAN}Modrý vyhrál:${RESET}   ${blueWins}× (${((blueWins/numGames)*100).toFixed(1)}%)`);
  if (timeouts > 0) console.log(`  ${YELLOW}Timeout:${RESET}         ${timeouts}× (${((timeouts/numGames)*100).toFixed(1)}%)`);
  console.log(`${"─".repeat(50)}`);
  console.log(`  Průměr tahů:   ${avgTurns}`);
  console.log(`  Medián tahů:   ${medianTurns}`);
  console.log(`  Rozsah:        ${minTurns}–${maxTurns}`);
  console.log(`  Čas:           ${elapsed}s`);
  console.log(`${"─".repeat(50)}`);

  // ── Chyby ──

  if (totalErrors > 0) {
    console.log(`\n${RED}${BOLD}⚠ CHYBY: ${totalErrors} celkem${RESET}`);
    console.log(`${"─".repeat(50)}`);

    // Seskup podle chybové zprávy
    const errorGroups = {};
    for (const e of allErrors) {
      const key = e.msg;
      if (!errorGroups[key]) errorGroups[key] = { count: 0, examples: [] };
      errorGroups[key].count++;
      if (errorGroups[key].examples.length < 3) {
        errorGroups[key].examples.push(e);
      }
    }

    for (const [msg, group] of Object.entries(errorGroups)) {
      console.log(`\n  ${RED}${msg}${RESET} — ${group.count}× výskyt`);
      for (const ex of group.examples) {
        console.log(`    Hra #${ex.gameId}, tah ${ex.turn}, ${ex.player}`);
        if (ex.action) console.log(`      Akce: ${ex.action}`);
        if (ex.stack) console.log(`      ${ex.stack.split("\n").slice(0, 3).join("\n      ")}`);
      }
    }
  } else {
    console.log(`\n  ${GREEN}${BOLD}✅ ŽÁDNÉ CHYBY — všechny hry proběhly bez problémů${RESET}`);
  }

  // ── Balance hodnocení ──

  console.log(`\n${BOLD}⚖ BALANCE HODNOCENÍ${RESET}`);
  console.log(`${"─".repeat(50)}`);
  const diff = Math.abs(redWins - blueWins) / numGames;
  if (diff < 0.05) {
    console.log(`  ${GREEN}✓ Vynikající balance${RESET} (rozdíl < 5%)`);
  } else if (diff < 0.10) {
    console.log(`  ${GREEN}✓ Dobrá balance${RESET} (rozdíl < 10%)`);
  } else if (diff < 0.20) {
    console.log(`  ${YELLOW}⚠ Mírná nerovnováha${RESET} (rozdíl ${(diff*100).toFixed(1)}%)`);
  } else {
    console.log(`  ${RED}✗ Výrazná nerovnováha!${RESET} (rozdíl ${(diff*100).toFixed(1)}%)`);
  }

  if (timeouts > 0) {
    const toPct = ((timeouts/numGames)*100).toFixed(1);
    if (timeouts / numGames > 0.1) {
      console.log(`  ${RED}✗ Příliš mnoho timeoutů (${toPct}%) — hry se nekončí${RESET}`);
    } else {
      console.log(`  ${YELLOW}⚠ Timeouty: ${toPct}%${RESET}`);
    }
  }

  if (Number(avgTurns) > 200) {
    console.log(`  ${YELLOW}⚠ Hry jsou příliš dlouhé (průměr ${avgTurns} tahů)${RESET}`);
  } else if (Number(avgTurns) < 10) {
    console.log(`  ${YELLOW}⚠ Hry jsou příliš krátké (průměr ${avgTurns} tahů)${RESET}`);
  } else {
    console.log(`  ${GREEN}✓ Délka hry v normě${RESET} (průměr ${avgTurns} tahů)`);
  }

  // ── Akční statistiky ──

  console.log(`\n${BOLD}🎯 STATISTIKY AKCÍ${RESET}`);
  console.log(`${"─".repeat(50)}`);
  const totalActions = Object.values(actionStats).reduce((a, b) => a + b, 0);
  const actionNames = {
    move: "Pohyb",
    attack: "Útok (kostkou)",
    tower_move: "Pohyb věže",
    tower_attack: "Útok věží",
    jump: "Skok z věže",
    jump_attack: "Útok skokem",
    escape: "Útěk z věže",
    reform: "Přeformování",
    collapse: "Kolaps",
  };
  const sorted = Object.entries(actionStats).sort((a, b) => b[1] - a[1]);
  for (const [type, count] of sorted) {
    const pct = ((count / totalActions) * 100).toFixed(1);
    const name = actionNames[type] || type;
    console.log(`  ${name.padEnd(20)} ${String(count).padStart(6)}× (${pct}%)`);
  }

  // ── Výhry eliminací ──

  const totalElim = winByElim.red + winByElim.blue;
  if (totalElim > 0) {
    console.log(`\n${BOLD}💀 VÝHRY ELIMINACÍ (soupeř bez kostek)${RESET}`);
    console.log(`${"─".repeat(50)}`);
    console.log(`  Červený: ${winByElim.red}×  Modrý: ${winByElim.blue}×  (celkem ${totalElim}, ${((totalElim/numGames)*100).toFixed(1)}% her)`);
  }

  // ── Timeout diagnostika ──

  if (timeoutDiags && timeoutDiags.length > 0) {
    console.log(`\n${BOLD}⏱ DIAGNOSTIKA TIMEOUTŮ (prvních ${Math.min(3, timeoutDiags.length)})${RESET}`);
    console.log(`${"─".repeat(50)}`);
    for (const td of timeoutDiags.slice(0, 3)) {
      console.log(`\n  ${YELLOW}Hra #${td.gameId}${RESET}`);
      console.log(`  Skóre: Red=${td.scores.red.total} (destr=${td.scores.red.destruction}, fp=${td.scores.red.focalPoints}) | Blue=${td.scores.blue.total} (destr=${td.scores.blue.destruction}, fp=${td.scores.blue.focalPoints})`);
      console.log(`  Red kostky: ${td.redDice.map(d => d.val + "@" + d.pos).join(", ")}`);
      console.log(`  Blue kostky: ${td.blueDice.map(d => d.val + "@" + d.pos).join(", ")}`);
      if (td.lastActions.length > 0) {
        console.log(`  Posledních ${Math.min(10, td.lastActions.length)} tahů:`);
        for (const a of td.lastActions.slice(-10)) console.log(`    ${a}`);
      }
    }
  }

  // ── Strategická analýza ──

  const finishedGames = redWins + blueWins;
  if (finishedGames > 0) {
    console.log(`\n${BOLD}🏆 STRATEGICKÁ ANALÝZA${RESET}`);
    console.log(`${"-".repeat(60)}`);

    // 1) Jak se vyhrává
    console.log(`\n  ${BOLD}Jak se vyhrává:${RESET}`);
    console.log(`  Ohniska (≥3 fp):    ${strategy.winByFocal}× (${((strategy.winByFocal/finishedGames)*100).toFixed(1)}%)`);
    console.log(`  Destrukce (≥5 dp):  ${strategy.winByDestruction}× (${((strategy.winByDestruction/finishedGames)*100).toFixed(1)}%)`);
    console.log(`  Mix (fp + dp):      ${strategy.winByMixed}× (${((strategy.winByMixed/finishedGames)*100).toFixed(1)}%)`);

    // 2) Průměry vítěz vs poražený
    const avg = arr => arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
    console.log(`\n  ${BOLD}Průměrné hodnoty (vítěz vs poražený):${RESET}`);
    console.log(`                       Vítěz     Poražený   Rozdíl`);
    console.log(`  ${"-".repeat(56)}`);
    const pairs = [
      ["Útoky/hra", strategy.winnerAttacks, strategy.loserAttacks],
      ["Reformy/hra", strategy.winnerReforms, strategy.loserReforms],
      ["Věžní akce/hra", strategy.winnerTowerActions, strategy.loserTowerActions],
      ["Tahy k ohniskům", strategy.winnerFocalMoves, strategy.loserFocalMoves],
      ["Body destrukce", strategy.winnerDestrScores, strategy.loserDestrScores],
      ["Body ohniska", strategy.winnerFocalScores, strategy.loserFocalScores],
    ];
    for (const [label, wArr, lArr] of pairs) {
      const wa = avg(wArr);
      const la = avg(lArr);
      const d = wa - la;
      const arrow = d > 0.5 ? GREEN + "↑" : d < -0.5 ? RED + "↓" : YELLOW + "≈";
      console.log(`  ${label.padEnd(20)} ${wa.toFixed(1).padStart(7)}   ${la.toFixed(1).padStart(7)}   ${arrow} ${d > 0 ? "+" : ""}${d.toFixed(1)}${RESET}`);
    }

    // 3) Rozložení akcí vítěz vs poražený (procenta)
    console.log(`\n  ${BOLD}Rozložení akcí (%):${RESET}`);
    console.log(`                       Vítěz     Poražený`);
    console.log(`  ${"-".repeat(46)}`);
    const wTotal = Object.values(strategy.winnerActions).reduce((a,b)=>a+b,0) || 1;
    const lTotal = Object.values(strategy.loserActions).reduce((a,b)=>a+b,0) || 1;
    const allTypes = [...new Set([...Object.keys(strategy.winnerActions), ...Object.keys(strategy.loserActions)])];
    allTypes.sort((a,b) => (strategy.winnerActions[b]||0) - (strategy.winnerActions[a]||0));
    for (const t of allTypes) {
      const name = actionNames[t] || t;
      const wPct = ((strategy.winnerActions[t]||0)/wTotal*100).toFixed(1);
      const lPct = ((strategy.loserActions[t]||0)/lTotal*100).toFixed(1);
      console.log(`  ${name.padEnd(20)} ${wPct.padStart(6)}%   ${lPct.padStart(6)}%`);
    }

    // 4) Rychlé vs pomalé výhry
    console.log(`\n  ${BOLD}Tempo her:${RESET}`);
    console.log(`  Rychlé výhry (<30 tahů): ${strategy.fastWins.length}× (${((strategy.fastWins.length/finishedGames)*100).toFixed(1)}%)`);
    console.log(`  Pomalé výhry (>80 tahů): ${strategy.slowWins.length}× (${((strategy.slowWins.length/finishedGames)*100).toFixed(1)}%)`);

    // 5) Závěr — vítězná strategie
    const wAtk = avg(strategy.winnerAttacks);
    const lAtk = avg(strategy.loserAttacks);
    const wRef = avg(strategy.winnerReforms);
    const lRef = avg(strategy.loserReforms);
    const wTow = avg(strategy.winnerTowerActions);
    const lTow = avg(strategy.loserTowerActions);
    const wFoc = avg(strategy.winnerFocalMoves);
    const lFoc = avg(strategy.loserFocalMoves);

    console.log(`\n  ${BOLD}${GREEN}📌 ZÁVĚR — VÍTĚZNÉ VZORCE:${RESET}`);
    console.log(`  ${"-".repeat(56)}`);
    const conclusions = [];
    if (wAtk > lAtk + 0.5) conclusions.push(`Agrese: vítěz útočí víc (${wAtk.toFixed(1)} vs ${lAtk.toFixed(1)} útoků/hra)`);
    if (wAtk < lAtk - 0.5) conclusions.push(`Pasivita: vítěz útočí MÉNĚ (${wAtk.toFixed(1)} vs ${lAtk.toFixed(1)})`);
    if (wRef < lRef - 0.5) conclusions.push(`Méně reformů: vítěz reformuje méně (${wRef.toFixed(1)} vs ${lRef.toFixed(1)})`);
    if (wRef > lRef + 0.5) conclusions.push(`Více reformů: vítěz reformuje víc (${wRef.toFixed(1)} vs ${lRef.toFixed(1)})`);
    if (wTow > lTow + 0.5) conclusions.push(`Věže: vítěz více využívá věže (${wTow.toFixed(1)} vs ${lTow.toFixed(1)})`);
    if (wFoc > lFoc + 0.5) conclusions.push(`Ohniska: vítěz cílí na ohniska více (${wFoc.toFixed(1)} vs ${lFoc.toFixed(1)})`);
    if (strategy.winByFocal > strategy.winByDestruction) conclusions.push(`Dominantní cesta k vítězství: obsazení ohnisek (${((strategy.winByFocal/finishedGames)*100).toFixed(0)}%)`);
    else if (strategy.winByDestruction > strategy.winByFocal) conclusions.push(`Dominantní cesta k vítězství: destrukce kostek (${((strategy.winByDestruction/finishedGames)*100).toFixed(0)}%)`);
    else conclusions.push(`Cesty k vítězství jsou vyrovnané (ohniska vs destrukce)`);
    if (strategy.winByMixed / finishedGames > 0.3) conclusions.push(`Smíšená strategie (fp+dp) je velmi běžná (${((strategy.winByMixed/finishedGames)*100).toFixed(0)}%)`);
    if (conclusions.length === 0) conclusions.push("Žádné výrazné vzorce — hra je vyrovnaná");
    for (const c of conclusions) console.log(`  ${GREEN}✦${RESET} ${c}`);
  }

  console.log(`\n${CYAN}═══════════════════════════════════════════════════════${RESET}\n`);

  return { redWins, blueWins, timeouts, totalErrors, avgTurns: Number(avgTurns) };
}

// ═══════════════════════════════════════════════════════════════
// SPUŠTĚNÍ
// ═══════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const NUM_GAMES = parseInt(args[0]) || 100;
const VERBOSE = args.includes("-v") || args.includes("--verbose");

runSimulation(NUM_GAMES, VERBOSE);
