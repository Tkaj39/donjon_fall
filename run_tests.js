// Node.js test runner for Pád Donjonu
// Loads game.js in a vm context and runs assertions

const fs = require("fs");
const vm = require("vm");

// Load game.js source — convert const/let/class to var so they become sandbox globals
let gameSource = fs.readFileSync(__dirname + "/src/game.js", "utf-8");
gameSource = gameSource.replace(/\bconst\b/g, "var").replace(/\blet\b/g, "var");
// Convert "class Foo {" → "var Foo = class Foo {"
gameSource = gameSource.replace(/^class\s+(\w+)/gm, "var $1 = class $1");

// Create sandbox with console
const sandbox = {
  console,
  Math,
  Map,
  Set,
  Object,
  Array,
  JSON,
  parseInt,
  parseFloat,
  isNaN,
  isFinite,
  undefined,
  null: null,
  Infinity,
  NaN,
};

vm.createContext(sandbox);
vm.runInContext(gameSource, sandbox);

// Extract globals
const {
  Player, DiceType, HexMap, GameState,
  hexKey, hexEquals, hexDistance, hexNeighbor, hexAllNeighbors, getDirection,
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
} = sandbox;

// ═════════════════════════════════════════════════════════════
// MINIMÁLNÍ FRAMEWORK
// ═════════════════════════════════════════════════════════════

let _passed = 0, _failed = 0;
const RED = "\x1b[31m", GREEN = "\x1b[32m", YELLOW = "\x1b[33m", CYAN = "\x1b[36m", RESET = "\x1b[0m", BOLD = "\x1b[1m";

function section(name) {
  console.log(`\n${CYAN}── ${name} ──${RESET}`);
}

function assert(cond, name, detail) {
  if (cond) {
    _passed++;
    console.log(`  ${GREEN}✓${RESET} ${name}`);
  } else {
    _failed++;
    console.log(`  ${RED}✗ ${name}${RESET}`);
    if (detail) console.log(`    ${RED}${detail}${RESET}`);
  }
}

function assertEqual(actual, expected, name) {
  assert(actual === expected, name,
    `Očekáváno: ${JSON.stringify(expected)}, dostáno: ${JSON.stringify(actual)}`);
}

function assertNotEqual(actual, ne, name) {
  assert(actual !== ne, name,
    `Nemělo být: ${JSON.stringify(ne)}`);
}

function assertRange(actual, min, max, name) {
  assert(actual >= min && actual <= max, name,
    `Očekáváno ${min}–${max}, dostáno: ${actual}`);
}

function assertTruthy(val, name) {
  assert(!!val, name, `Očekáváno truthy, dostáno: ${JSON.stringify(val)}`);
}

// ═════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════

function freshGS() {
  const gs = new GameState();
  gs.board.clear();
  gs.dice = [];
  gs.scores = { red: 0, blue: 0 };
  gs.turn = Player.Red;
  gs.turnNumber = 1;
  gs.winner = null;
  return gs;
}

function place(gs, owner, value, q, r) {
  const die = createDieWithValue(owner, DiceType.D6, value);
  gs._placeDie(die, { q, r });
  return die;
}

// ═════════════════════════════════════════════════════════════
// TESTY
// ═════════════════════════════════════════════════════════════

section("DD-1: Nadvláda = horní kostka");

(function() {
  const r1 = createDieWithValue(Player.Red, DiceType.D6, 1);
  const b6 = createDieWithValue(Player.Blue, DiceType.D6, 6);
  assertEqual(towerDominance([b6, r1]), Player.Red, "R1 nahoře, B6 dole → Red");
})();

(function() {
  const r6 = createDieWithValue(Player.Red, DiceType.D6, 6);
  const b6 = createDieWithValue(Player.Blue, DiceType.D6, 6);
  assertEqual(towerDominance([r6, b6]), Player.Blue, "Obě 6, Blue nahoře → Blue");
})();

(function() {
  const r3 = createDieWithValue(Player.Red, DiceType.D6, 3);
  assertEqual(towerDominance([r3]), Player.Red, "Samotná → vlastník");
})();

(function() {
  assertEqual(towerDominance([]), null, "Prázdná → null");
})();

(function() {
  const dice = [
    createDieWithValue(Player.Red, DiceType.D6, 1),
    createDieWithValue(Player.Blue, DiceType.D6, 2),
    createDieWithValue(Player.Red, DiceType.D6, 3),
    createDieWithValue(Player.Blue, DiceType.D6, 4),
    createDieWithValue(Player.Red, DiceType.D6, 5),
  ];
  assertEqual(towerDominance(dice), Player.Red, "5-věž: Red nahoře");
})();


section("A13: Nadvláda nikdy null");

(function() {
  const r6 = createDieWithValue(Player.Red, DiceType.D6, 6);
  const b6 = createDieWithValue(Player.Blue, DiceType.D6, 6);
  assertNotEqual(towerDominance([r6, b6]), null, "Stejné 6,6 → NOT null");
  assertEqual(towerDominance([r6, b6]), Player.Blue, "Blue nahoře");
})();


section("DD-2: Útočná síla");

(function() {
  const r4 = createDieWithValue(Player.Red, DiceType.D6, 4);
  assertEqual(formationAttackStrength([r4], Player.Red), 4, "Samo 4 → 4");
})();

(function() {
  const r5 = createDieWithValue(Player.Red, DiceType.D6, 5);
  const r3 = createDieWithValue(Player.Red, DiceType.D6, 3);
  assertEqual(formationAttackStrength([r5, r3], Player.Red), 4, "[R5,R3]: 3+(2-1)-0=4");
})();

(function() {
  const b2 = createDieWithValue(Player.Blue, DiceType.D6, 2);
  const r6 = createDieWithValue(Player.Red, DiceType.D6, 6);
  assertEqual(formationAttackStrength([b2, r6], Player.Red), 5, "[B2,R6] Red: 6+0-1=5");
})();

(function() {
  const dice = [
    createDieWithValue(Player.Red, DiceType.D6, 1),
    createDieWithValue(Player.Blue, DiceType.D6, 2),
    createDieWithValue(Player.Red, DiceType.D6, 3),
    createDieWithValue(Player.Blue, DiceType.D6, 4),
    createDieWithValue(Player.Red, DiceType.D6, 5),
  ];
  assertEqual(formationAttackStrength(dice, Player.Red), 5, "5-věž Red=5");
  assertEqual(formationAttackStrength(dice, Player.Blue), 3, "5-věž Blue=3");
})();

(function() {
  assertEqual(formationAttackStrength([], Player.Red), 0, "Prázdná → 0");
})();


section("DD-3: Dosah věže");

(function() {
  const r1 = createDieWithValue(Player.Red, DiceType.D6, 1);
  const r2 = createDieWithValue(Player.Red, DiceType.D6, 2);
  assertEqual(towerReach([r1, r2], Player.Red), 2, "2 own, 0 opp → 2");
})();

(function() {
  const r1 = createDieWithValue(Player.Red, DiceType.D6, 1);
  const b2 = createDieWithValue(Player.Blue, DiceType.D6, 2);
  const r3 = createDieWithValue(Player.Red, DiceType.D6, 3);
  assertEqual(towerReach([r1, b2, r3], Player.Red), 1, "2 own, 1 opp → 1");
})();

(function() {
  const r1 = createDieWithValue(Player.Red, DiceType.D6, 1);
  const b2 = createDieWithValue(Player.Blue, DiceType.D6, 2);
  const b3 = createDieWithValue(Player.Blue, DiceType.D6, 3);
  assertEqual(towerReach([r1, b2, b3], Player.Red), 1, "1 own, 2 opp → min 1");
})();

(function() {
  const r1 = createDieWithValue(Player.Red, DiceType.D6, 1);
  const r2 = createDieWithValue(Player.Red, DiceType.D6, 2);
  const r3 = createDieWithValue(Player.Red, DiceType.D6, 3);
  const b4 = createDieWithValue(Player.Blue, DiceType.D6, 4);
  assertEqual(towerReach([r1, r2, r3, b4], Player.Red), 2, "3 own, 1 opp → 2");
})();


section("DD-3: Pohyb věže — BFS");

(function() {
  const gs = freshGS();
  place(gs, Player.Red, 3, 0, 0);
  place(gs, Player.Red, 4, 0, 0);
  place(gs, Player.Red, 5, 0, 0);
  const result = findTowerMoveTargets(gs, {q:0,r:0}, Player.Red);
  const maxDist = Math.max(...result.targets.map(t => hexDistance({q:0,r:0}, t.target)));
  assertEqual(maxDist, 3, "3 own → dosah 3");
})();

(function() {
  const gs = freshGS();
  place(gs, Player.Red, 2, 0, 0);
  place(gs, Player.Blue, 3, 0, 0);
  place(gs, Player.Red, 5, 0, 0);
  const result = findTowerMoveTargets(gs, {q:0,r:0}, Player.Red);
  const dists = result.targets.map(t => hexDistance({q:0,r:0}, t.target));
  const maxDist = dists.length > 0 ? Math.max(...dists) : 0;
  assertEqual(maxDist, 1, "Smíšená [R,B,R] → dosah 1");
})();


section("DD-3: Skok z věže");

(function() {
  const gs = freshGS();
  place(gs, Player.Red, 2, 0, 0);
  place(gs, Player.Red, 3, 0, 0);
  place(gs, Player.Red, 5, 0, 0);
  const result = findTowerJumpTargets(gs, {q:0,r:0}, Player.Red);
  const maxDist = Math.max(...result.targets.map(t => hexDistance({q:0,r:0}, t.target)));
  assertEqual(maxDist, 3, "Skok 3 own → dosah 3");
})();


section("A5: Cap defender reroll");

(function() {
  let capped = true;
  for (let i = 0; i < 200; i++) {
    const atk = createDieWithValue(Player.Red, DiceType.D6, 6);
    const def = createDieWithValue(Player.Blue, DiceType.D6, 3);
    combatPhase1(atk, [def]);
    if (def.value > 3) { capped = false; break; }
  }
  assert(capped, "200× reroll: defender ≤ old (3)");
})();

(function() {
  let ok = true;
  for (let i = 0; i < 50; i++) {
    const atk = createDieWithValue(Player.Red, DiceType.D6, 6);
    const def = createDieWithValue(Player.Blue, DiceType.D6, 1);
    combatPhase1(atk, [def]);
    if (def.value !== 1) { ok = false; break; }
  }
  assert(ok, "Defender 1 → always 1");
})();

(function() {
  const atk = createDieWithValue(Player.Red, DiceType.D6, 6);
  const def = createDieWithValue(Player.Blue, DiceType.D6, 3);
  const r = combatPhase1(atk, [def]);
  assertEqual(r.newAttackerValue, 5, "Attacker wear: 6→5");
})();

(function() {
  let ok = true;
  for (let i = 0; i < 100; i++) {
    const atk = createDieWithValue(Player.Red, DiceType.D6, 6);
    const d1 = createDieWithValue(Player.Blue, DiceType.D6, 2);
    const d2 = createDieWithValue(Player.Blue, DiceType.D6, 4);
    combatPhase1(atk, [d1, d2]);
    if (d1.value > 2 || d2.value > 4) { ok = false; break; }
  }
  assert(ok, "Multi-def [2,4]: both capped");
})();


section("A6: Přeformování");

(function() {
  let ok = true;
  for (let i = 0; i < 200; i++) {
    const d = createDieWithValue(Player.Red, DiceType.D6, 3);
    if (executeReform(d).newValue < 3) { ok = false; break; }
  }
  assert(ok, "200× reform(3) ≥ 3");
})();

(function() {
  assertEqual(executeReform(createDieWithValue(Player.Red, DiceType.D6, 6)).newValue, 6, "reform(6)=6");
})();

(function() {
  let sum = 0, N = 500;
  for (let i = 0; i < N; i++) sum += executeReform(createDieWithValue(Player.Red, DiceType.D6, 1)).newValue;
  assertRange(sum/N, 2.8, 4.2, `Stat avg reform(1) ≈ 3.5 (${(sum/N).toFixed(2)})`);
})();

(function() {
  let sum = 0, N = 500;
  for (let i = 0; i < N; i++) sum += executeReform(createDieWithValue(Player.Red, DiceType.D6, 5)).newValue;
  assertRange(sum/N, 4.8, 5.5, `Stat avg reform(5) ≈ 5.17 (${(sum/N).toFixed(2)})`);
})();


section("A8: Útěk z věže");

(function() {
  const gs = freshGS();
  place(gs, Player.Blue, 2, 0, 0);
  place(gs, Player.Red, 5, 0, 0);
  const r = findEscapeTargets(gs, {q:0,r:0}, Player.Red);
  assert(r.targets.length > 0, "R5 vs 1 enemy → has targets");
  assertEqual(r.cost, 1, "Cost=1");
})();

(function() {
  const gs = freshGS();
  place(gs, Player.Blue, 3, 0, 0);
  place(gs, Player.Blue, 4, 0, 0);
  place(gs, Player.Red, 2, 0, 0);
  const r = findEscapeTargets(gs, {q:0,r:0}, Player.Red);
  assertEqual(r.targets.length, 0, "R2 < need 3 → no targets");
  assertTruthy(r.reason, "Has reason");
})();

(function() {
  const gs = freshGS();
  place(gs, Player.Blue, 1, 0, 0);
  place(gs, Player.Red, 4, 0, 0);
  const r = executeEscape(gs, {q:0,r:0}, {q:1,r:0}, Player.Red);
  assert(r.success, "Escape success");
  assertEqual(r.newValue, 3, "4-1=3");
  assertEqual(gs.getFormation({q:0,r:0}).length, 1, "Origin: 1 die");
  assertEqual(gs.getFormation({q:1,r:0}).length, 1, "Target: 1 die");
})();

(function() {
  const gs = freshGS();
  place(gs, Player.Blue, 1, 2, 0);
  place(gs, Player.Blue, 2, 2, 0);
  place(gs, Player.Blue, 3, 2, 0);
  place(gs, Player.Red, 4, 2, 0);
  const r = executeEscape(gs, {q:2,r:0}, {q:3,r:0}, Player.Red);
  assert(r.success, "Escape 4-tower ok");
  assertEqual(r.newValue, 1, "max(1, 4-3)=1");
})();

(function() {
  const gs = freshGS();
  place(gs, Player.Red, 3, 0, 0);
  place(gs, Player.Red, 5, 0, 0);
  assertEqual(findEscapeTargets(gs, {q:0,r:0}, Player.Red).targets.length, 0, "Own tower → no escape");
})();

(function() {
  const gs = freshGS();
  place(gs, Player.Red, 3, 0, 0);
  place(gs, Player.Blue, 5, 0, 0);
  assertEqual(findEscapeTargets(gs, {q:0,r:0}, Player.Red).targets.length, 0, "Enemy top → Red can't escape");
})();


section("A9: Průchod přes vlastní");

(function() {
  const gs = freshGS();
  const m = place(gs, Player.Red, 6, -2, 0);
  place(gs, Player.Red, 5, -1, 0);
  const moves = findValidMoves(gs, m);
  assert(moves.some(mv => hexEquals(mv.target, {q:0,r:0})), "6 passes own 5");
  assert(moves.some(mv => hexEquals(mv.target, {q:-1,r:0})), "6 stops on own 5");
})();

(function() {
  const gs = freshGS();
  const m = place(gs, Player.Red, 2, -2, 0);
  place(gs, Player.Red, 5, -1, 0);
  const moves = findValidMoves(gs, m);
  assert(!moves.some(mv => hexEquals(mv.target, {q:0,r:0})), "2 can't pass own 5");
  assert(moves.some(mv => hexEquals(mv.target, {q:-1,r:0})), "2 stops on own 5");
})();

(function() {
  const gs = freshGS();
  const m = place(gs, Player.Red, 6, -3, 0);
  place(gs, Player.Red, 3, -2, 0);
  place(gs, Player.Red, 2, -1, 0);
  const moves = findValidMoves(gs, m);
  assert(moves.some(mv => hexEquals(mv.target, {q:0,r:0})), "6 passes chain [3,2]");
})();


section("A14: Kolaps věže");

(function() {
  const gs = freshGS();
  const bot = place(gs, Player.Blue, 3, 0, 0);
  place(gs, Player.Red, 4, 0, 0);
  place(gs, Player.Red, 6, 0, 0);
  const t = findCollapsibleTowers(gs, Player.Red);
  assertEqual(t.towers.length, 1, "1 collapsible tower");
  assertEqual(t.towers[0].bottomDie.owner, Player.Blue, "Bottom=Blue");
  const r = executeCollapse(gs, {q:0,r:0}, Player.Red);
  assert(r.success, "Collapse OK");
  assert(r.wasEnemy, "Enemy removed");
  assertEqual(r.points, 1, "1 point");
  assertEqual(gs.getFormation({q:0,r:0}).length, 2, "2 remain");
  assert(!bot.alive, "Bottom dead");
})();

(function() {
  const gs = freshGS();
  place(gs, Player.Red, 3, 1, 0);
  place(gs, Player.Red, 4, 1, 0);
  place(gs, Player.Blue, 6, 1, 0);
  assertEqual(findCollapsibleTowers(gs, Player.Red).towers.length, 0, "Blue top → no collapse");
})();

(function() {
  const gs = freshGS();
  place(gs, Player.Blue, 2, 0, 0);
  place(gs, Player.Red, 5, 0, 0);
  assert(!executeCollapse(gs, {q:0,r:0}, Player.Red).success, "<3 → no collapse");
})();

(function() {
  const gs = freshGS();
  const mb = place(gs, Player.Red, 1, 0, 0);
  place(gs, Player.Blue, 3, 0, 0);
  place(gs, Player.Red, 5, 0, 0);
  const r = executeCollapse(gs, {q:0,r:0}, Player.Red);
  assert(r.success, "Own bottom: OK");
  assert(!r.wasEnemy, "Own die");
  assertEqual(r.points, 0, "0 points for own");
  assert(!mb.alive, "Own bottom dead");
})();


section("DD-4: Sabotáž zrušena");

(function() {
  assert(typeof sandbox.findSabotageTargets === "undefined", "findSabotageTargets undef");
  assert(typeof sandbox.executeSabotage === "undefined", "executeSabotage undef");
})();


section("getDirection");

(function() {
  assertEqual(getDirection({q:0,r:0}, {q:1,r:0}), 0, "E=0");
  assertEqual(getDirection({q:0,r:0}, {q:1,r:-1}), 1, "NE=1");
  assertEqual(getDirection({q:0,r:0}, {q:0,r:-1}), 2, "NW=2");
  assertEqual(getDirection({q:0,r:0}, {q:-1,r:0}), 3, "W=3");
  assertEqual(getDirection({q:0,r:0}, {q:-1,r:1}), 4, "SW=4");
  assertEqual(getDirection({q:0,r:0}, {q:0,r:1}), 5, "SE=5");
  assertEqual(getDirection({q:0,r:0}, {q:2,r:0}), -1, "Non-neighbor=-1");
})();


section("HexMap");

(function() {
  const m = new HexMap();
  assertEqual(m.size, 61, "61 hexes");
  assertEqual(m.getBaseCells(Player.Red).length, 5, "Red base: 5");
  assertEqual(m.getBaseCells(Player.Blue).length, 5, "Blue base: 5");
  assertEqual(m.getFocalPoints().length, 3, "3 focal points");
})();


section("Helpers: isTower, isMixed, topDie, bottomDie");

(function() {
  const r = createDieWithValue(Player.Red, DiceType.D6, 3);
  assert(!isTower([r]), "1 die → not tower");
  assert(isTower([r, createDieWithValue(Player.Red, DiceType.D6, 4)]), "2 → tower");
})();

(function() {
  const r = createDieWithValue(Player.Red, DiceType.D6, 1);
  const b = createDieWithValue(Player.Blue, DiceType.D6, 2);
  assert(isMixedFormation([r, b]), "R+B = mixed");
  assert(!isMixedFormation([r, createDieWithValue(Player.Red, DiceType.D6, 3)]), "R+R != mixed");
})();

(function() {
  const r1 = createDieWithValue(Player.Red, DiceType.D6, 1);
  const r6 = createDieWithValue(Player.Red, DiceType.D6, 6);
  assertEqual(topDie([r1, r6]).value, 6, "top([1,6])=6");
  assertEqual(bottomDie([r1, r6]).value, 1, "bottom([1,6])=1");
  assertEqual(topDie([]), undefined, "top([])=undefined");
  assertEqual(bottomDie([]), undefined, "bottom([])=undefined");
})();


section("GameState basics");

(function() {
  const gs = freshGS();
  place(gs, Player.Red, 4, 0, 0);
  assertEqual(gs.getFormation({q:0,r:0}).length, 1, "Place 1 die");
  assert(!gs.isEmpty({q:0,r:0}), "Not empty");
  assert(gs.isEmpty({q:1,r:0}), "Neighbor empty");
})();

(function() {
  const gs = freshGS();
  const d = place(gs, Player.Red, 4, 0, 0);
  gs.moveDie(d, {q:1,r:0});
  assert(gs.isEmpty({q:0,r:0}), "Old empty after move");
  assertEqual(gs.getFormation({q:1,r:0}).length, 1, "New: 1 die");
})();

(function() {
  const gs = freshGS();
  const d = place(gs, Player.Red, 4, 0, 0);
  gs.destroyDie(d);
  assert(gs.isEmpty({q:0,r:0}), "Empty after destroy");
  assert(!d.alive, "Dead");
})();

(function() {
  const gs = new GameState();
  gs.setupWithValues([1,2,3,4,5], [6,5,4,3,2]);
  assertEqual(gs.getPlayerDice(Player.Red).length, 5, "5 red dice");
  assertEqual(gs.getPlayerDice(Player.Blue).length, 5, "5 blue dice");
})();


section("Scoring & Win");

(function() {
  const gs = freshGS();
  gs.addDestructionPoints(Player.Red, 3);
  assertEqual(gs.scores.red, 3, "3 destr points");
  assertEqual(gs.totalScore(Player.Red), 3, "Total 3");
})();

(function() {
  const gs = freshGS();
  gs.addDestructionPoints(Player.Red, 5);
  gs.turn = Player.Red;
  gs.checkWin();
  assertEqual(gs.winner, Player.Red, "5 pts → win");
})();

(function() {
  const gs = freshGS();
  gs.addDestructionPoints(Player.Red, 4);
  gs.turn = Player.Red;
  gs.checkWin();
  assertEqual(gs.winner, null, "4 pts → no win");
})();


section("Scénář: pohyb + útok");

(function() {
  const gs = freshGS();
  const a = place(gs, Player.Red, 4, -2, 0);
  place(gs, Player.Blue, 2, 0, 0);
  const t = findValidTargets(gs, a);
  const at = t.find(x => hexEquals(x.target, {q:0,r:0}));
  assertTruthy(at, "R4 → B2: attack found");
  assert(at.isAttack, "Is attack");
})();

(function() {
  const gs = freshGS();
  const a = place(gs, Player.Red, 2, -1, 0);
  place(gs, Player.Blue, 4, 0, 0);
  const t = findValidTargets(gs, a);
  assert(!t.find(x => hexEquals(x.target, {q:0,r:0})), "R2 can't attack B4");
})();

(function() {
  const gs = freshGS();
  const a = place(gs, Player.Red, 5, -1, 0);
  place(gs, Player.Blue, 2, 0, 0);
  place(gs, Player.Blue, 1, 0, 0);
  const t = findValidTargets(gs, a);
  assertTruthy(t.find(x => hexEquals(x.target, {q:0,r:0})), "R5 vs B tower [2,1] str 3");
})();


section("combatDisplace");

(function() {
  const gs = freshGS();
  const a = place(gs, Player.Red, 5, -1, 0);
  const d = place(gs, Player.Blue, 3, 0, 0);
  combatPhase1(a, [d]);
  combatDisplace(gs, {q:-1,r:0}, {q:0,r:0}, a);
  assertEqual(gs.getFormation({q:1,r:0}).length, 1, "Displaced to [1,0]");
})();


section("Edge case: řetězový odsun");

(function() {
  const gs = freshGS();
  const a = place(gs, Player.Red, 6, -1, 0);
  const d1 = place(gs, Player.Blue, 2, 0, 0);
  place(gs, Player.Blue, 3, 1, 0);
  combatPhase1(a, [d1]);
  combatDisplace(gs, {q:-1,r:0}, {q:0,r:0}, a);
  // After chain displacement: def1 moves to [1,0] (displacing def2 to [2,0])
  // [0,0] should be empty because def1 was pushed out
  assert(
    gs.getFormation({q:1,r:0}).length >= 1 || gs.getFormation({q:2,r:0}).length >= 1,
    "Chain: formations shifted east"
  );
  assert(gs.getFormation({q:2,r:0}).length >= 1, "Chain end at [2,0]");
})();


section("Edge case: obklíčení");

(function() {
  const gs = freshGS();
  const a = place(gs, Player.Red, 6, -1, 0);
  const d = place(gs, Player.Blue, 2, 0, 0);
  place(gs, Player.Red, 3, 1, 0);
  combatPhase1(a, [d]);
  const r = combatDisplace(gs, {q:-1,r:0}, {q:0,r:0}, a);
  assert(r.destroyed.length > 0, "Surrounded → destroyed");
  assert(r.points > 0, "Points awarded");
})();


section("Edge case: velké věže 5+");

(function() {
  const dice = [
    createDieWithValue(Player.Red, DiceType.D6, 1),
    createDieWithValue(Player.Blue, DiceType.D6, 2),
    createDieWithValue(Player.Red, DiceType.D6, 3),
    createDieWithValue(Player.Blue, DiceType.D6, 4),
    createDieWithValue(Player.Red, DiceType.D6, 5),
  ];
  assertEqual(towerDominance(dice), Player.Red, "5T: dom=Red");
  assertEqual(towerReach(dice, Player.Red), 1, "5T: reach Red=1");
  assertEqual(towerReach(dice, Player.Blue), 1, "5T: reach Blue=1");
  assertEqual(formationAttackStrength(dice, Player.Red), 5, "5T: str Red=5");
  assertEqual(formationAttackStrength(dice, Player.Blue), 3, "5T: str Blue=3");
  assert(isMixedFormation(dice), "5T mixed");
  assert(isTower(dice), "5T is tower");
})();


section("Edge case: pohyb u okraje mapy");

(function() {
  const gs = freshGS();
  const d = place(gs, Player.Red, 3, 4, 0);
  const moves = findValidMoves(gs, d);
  assert(moves.length > 0, "Edge has moves");
  assert(moves.length < 60, "Reasonable move count at edge (got " + moves.length + ")");
})();


section("executeMove: přesun");

(function() {
  const gs = freshGS();
  const d = place(gs, Player.Red, 3, 0, 0);
  const r = executeMove(gs, d, {q:1,r:0});
  assert(r.success, "Move to empty ok");
  assert(!r.attack, "Not attack");
  assertEqual(gs.getFormation({q:1,r:0}).length, 1, "Die at target");
})();

(function() {
  const gs = freshGS();
  const d = place(gs, Player.Red, 3, 0, 0);
  place(gs, Player.Red, 2, 1, 0);
  const r = executeMove(gs, d, {q:1,r:0});
  assert(r.success, "Stack on own ok");
  assertEqual(gs.getFormation({q:1,r:0}).length, 2, "Tower: 2 dice");
})();


section("executeMove: útok trigger");

(function() {
  const gs = freshGS();
  const d = place(gs, Player.Red, 5, -1, 0);
  place(gs, Player.Blue, 2, 0, 0);
  const r = executeMove(gs, d, {q:0,r:0});
  assert(r.success && r.attack, "Attack triggered");
  assertEqual(r.defenders.length, 1, "1 defender");
})();


// ═════════════════════════════════════════════════════════════
// VÝSLEDKY
// ═════════════════════════════════════════════════════════════

console.log("\n" + "═".repeat(50));
if (_failed === 0) {
  console.log(`${GREEN}${BOLD}✅ VŠECHNY TESTY PROŠLY: ${_passed}/${_passed + _failed}${RESET}`);
} else {
  console.log(`${RED}${BOLD}❌ SELHALO ${_failed} z ${_passed + _failed} testů${RESET}`);
}
console.log("═".repeat(50));

process.exit(_failed > 0 ? 1 : 0);
