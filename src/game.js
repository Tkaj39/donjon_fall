let _nextDieId = 1;
// ═══════════════════════════════════════════════════════════════
// PÁD DONJONU — Herní engine
// Spouští se v prohlížeči jako <script src="src/game.js">
// ═══════════════════════════════════════════════════════════════

"use strict";

// ── Konstanty ───────────────────────────────────────────────

const Player = Object.freeze({ Red: "red", Blue: "blue" });

const HexType = Object.freeze({
  Neutral: "neutral",
  RedBase: "red_base",
  BlueBase: "blue_base",
  FocalPoint: "focal_point",
});

const DiceType = Object.freeze({ D6: "d6" });

/** 6 směrů pohybu (pointy-top hexy). */
const Direction = Object.freeze({
  E: 0, NE: 1, NW: 2, W: 3, SW: 4, SE: 5,
});

const HEX_DIRECTIONS = Object.freeze([
  { q: +1, r: 0 },  // E
  { q: +1, r: -1 }, // NE
  { q: 0, r: -1 },  // NW
  { q: -1, r: 0 },  // W
  { q: -1, r: +1 }, // SW
  { q: 0, r: +1 },  // SE
]);

const MAP_RADIUS = 4;

const FOCAL_POINTS = [
  { q: -3, r: 0 },
  { q: 0, r: 0 },
  { q: +3, r: 0 },
];

// ── Hex utility funkce ──────────────────────────────────────

function hexKey(coord) {
  return coord.q + "," + coord.r;
}

function hexEquals(a, b) {
  return a.q === b.q && a.r === b.r;
}

function hexS(coord) {
  return -coord.q - coord.r;
}

function hexNeighbor(coord, dir) {
  const d = HEX_DIRECTIONS[dir];
  return { q: coord.q + d.q, r: coord.r + d.r };
}

function hexAllNeighbors(coord) {
  return HEX_DIRECTIONS.map(d => ({ q: coord.q + d.q, r: coord.r + d.r }));
}

function hexDistance(a, b) {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  const ds = hexS(a) - hexS(b);
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(ds));
}

/**
 * Vrátí index směru (0–5) ze sousedního hexu `from` do hexu `to`.
 * Pokud `from` a `to` nejsou sousedi, vrátí -1.
 */
function getDirection(from, to) {
  const dq = to.q - from.q;
  const dr = to.r - from.r;
  for (let i = 0; i < HEX_DIRECTIONS.length; i++) {
    if (HEX_DIRECTIONS[i].q === dq && HEX_DIRECTIONS[i].r === dr) return i;
  }
  return -1;
}
class HexMap {
  constructor() {
    /** @type {Map<string, {coord: {q:number,r:number}, type: string, key: string}>} */
    this.cells = new Map();
    this._generate();
  }

  _generate() {
    for (let q = -MAP_RADIUS; q <= MAP_RADIUS; q++) {
      for (let r = -MAP_RADIUS; r <= MAP_RADIUS; r++) {
        if (Math.abs(q + r) > MAP_RADIUS) continue;
        const coord = { q, r };
        const type = this._resolveType(coord);
        const key = hexKey(coord);
        this.cells.set(key, { coord, type, key });
      }
    }
  }

  _resolveType(coord) {
    if (coord.r === -MAP_RADIUS) return HexType.RedBase;
    if (coord.r === MAP_RADIUS) return HexType.BlueBase;
    if (FOCAL_POINTS.some(fp => hexEquals(fp, coord))) return HexType.FocalPoint;
    return HexType.Neutral;
  }

  get size() { return this.cells.size; }

  getCell(coord) { return this.cells.get(hexKey(coord)); }

  isValid(coord) { return this.cells.has(hexKey(coord)); }

  getNeighbors(coord) {
    return hexAllNeighbors(coord)
      .map(n => this.getCell(n))
      .filter(c => c != null);
  }

  getNeighborInDirection(coord, dir) {
    return this.getCell(hexNeighbor(coord, dir));
  }

  getCellsByType(type) {
    return [...this.cells.values()].filter(c => c.type === type);
  }

  getAllCells() { return [...this.cells.values()]; }

  getBaseCells(player) {
    return this.getCellsByType(player === Player.Red ? HexType.RedBase : HexType.BlueBase);
  }

  getFocalPoints() { return this.getCellsByType(HexType.FocalPoint); }

  /**
   * BFS: všechny hexy dosažitelné z `from` za 1 až `maxSteps` kroků.
   * Neřeší obsazenost — to je úloha herní logiky.
   */
  getReachable(from, maxSteps) {
    const visited = new Set();
    visited.add(hexKey(from));
    let frontier = [from];
    const result = [];

    for (let step = 0; step < maxSteps; step++) {
      const next = [];
      for (const coord of frontier) {
        for (const nb of hexAllNeighbors(coord)) {
          const k = hexKey(nb);
          if (!this.isValid(nb) || visited.has(k)) continue;
          visited.add(k);
          next.push(nb);
          result.push(nb);
        }
      }
      frontier = next;
    }
    return result;
  }

  /** Textový výpis mapy do konzole. */
  debugPrint() {
    const lines = [];
    for (let r = -MAP_RADIUS; r <= MAP_RADIUS; r++) {
      const indent = " ".repeat(Math.abs(r));
      const row = [];
      for (let q = -MAP_RADIUS; q <= MAP_RADIUS; q++) {
        const cell = this.getCell({ q, r });
        if (!cell) continue;
          switch (cell.type) {
          case HexType.RedBase:    row.push("R"); break;
          case HexType.BlueBase:   row.push("B"); break;
          case HexType.FocalPoint: row.push("★"); break;
          default:                 row.push("·"); break;
        }
      }
      lines.push(indent + row.join(" "));
    }
      return lines.join("\n");
  }
}

// ═══════════════════════════════════════════════════════════════
// KOSTKY, VĚŽE, NADVLÁDA
// ═══════════════════════════════════════════════════════════════



/** Vytvoří novou kostku s náhodnou hodnotou. */
function createDie(owner, type) {
  return {
    id: _nextDieId++,
    owner,            // Player.Red / Player.Blue
    type,             // DiceType.D6
    value: Math.floor(Math.random() * 6) + 1,
    alive: true,      // false = zničena (mimo hru)
  };
}

/** Vytvoří kostku s konkrétní hodnotou (pro testy). */
function createDieWithValue(owner, type, value) {
  return {
    id: _nextDieId++,
    owner,
    type,
    value,
    alive: true,
  };
}

/** Přehodí kostku — nová náhodná hodnota. */
function rerollDie(die) {
  die.value = Math.floor(Math.random() * 6) + 1;
}

/** Max hodnota kostky podle typu. */
function dieMaxValue(die) {
  return 6;
}

/** Body za zničení kostky (D6 = 1). */
function dieDestructionPoints(die) {
  return 1;
}


// ── Věž (formace na jednom poli) ────────────────────────────

/**
 * Formace = pole kostek stojících na jednom hexu.
 * Kostka nahoře (poslední prvek) je "horní" — ta může skákat.
 * 
 * Věž neexistuje jako samostatný objekt — je to jen pole kostek
 * na jednom poli v GameState.board.
 */

/** Je formace věž (2+ kostek)? */
function isTower(dice) {
  return dice.length >= 2;
}

/** Horní kostka formace (ta, co může skákat). */
function topDie(dice) {
  return dice[dice.length - 1];
}

/** Spodní kostka formace. */
function bottomDie(dice) {
  return dice[0];
}

/**
 * Útočná / obranná síla formace z pohledu daného hráče.
 * Vzorec: hodnota horní kostky + (počet vlastních kostek − 1) − počet soupeřových kostek.
 * Pro jedinou kostku: prostě její hodnota.
 */
function formationAttackStrength(dice, player) {
  if (dice.length === 0) return 0;
  const top = topDie(dice);
  const ownCount = dice.filter(d => d.owner === player).length;
  const oppCount = dice.length - ownCount;
  return top.value + (ownCount - 1) - oppCount;
}

/**
 * Dosah věže (pro pohyb i skok): počet vlastních − počet soupeřových (min 1).
 */
function towerReach(dice, player) {
  const ownCount = dice.filter(d => d.owner === player).length;
  const oppCount = dice.length - ownCount;
  return Math.max(1, ownCount - oppCount);
}

/**
 * Nadvláda nad věží.
 * Nadvládu má vždy hráč, jehož kostka je na VRCHOLU věže.
 * Vrací Player.Red, Player.Blue, nebo null (prázdná formace).
 */
function towerDominance(dice) {
  if (dice.length === 0) return null;
  return topDie(dice).owner;
}

/** Má hráč nadvládu nad touto formací? */
function hasDominance(dice, player) {
  return towerDominance(dice) === player;
}

/** Je formace smíšená (obsahuje kostky obou hráčů)? */
function isMixedFormation(dice) {
  const owners = new Set(dice.map(d => d.owner));
  return owners.size === 2;
}

/** Vrátí kostky daného hráče ve formaci. */
function playerDice(dice, player) {
  return dice.filter(d => d.owner === player);
}

/** Vrátí kostky soupeře ve formaci. */
function opponentDice(dice, player) {
  const opp = player === Player.Red ? Player.Blue : Player.Red;
  return dice.filter(d => d.owner === opp);
}

/** Soupeř. */
function opponent(player) {
  return player === Player.Red ? Player.Blue : Player.Red;
}

// ═══════════════════════════════════════════════════════════════
// STAV HRY
// ═══════════════════════════════════════════════════════════════

const WINNING_SCORE = 5;

/**
 * Herní stav.
 *
 * board:  Map<string, Die[]>  — klíč = hexKey, hodnota = pole kostek na tom poli
 * dice:   Die[]               — všechny kostky ve hře (živé i mrtvé)
 * scores: { red: number, blue: number }  — trvalé body (destrukce)
 * turn:   Player              — kdo je na tahu
 * turnNumber: number          — číslo tahu
 * winner: Player|null         — vítěz, pokud hra skončila
 */
class GameState {
    /**
     * Nový způsob přípravy hry dle pravidel:
     * Jeden hráč nastaví/hodí hodnoty (pole 5 hodnot), druhý dostane stejné hodnoty.
     * Hráč, který vybíral hodnoty jako druhý, začíná.
     * @param {number[]} firstPlayerValues - hodnoty kostek prvního hráče (pole 5 hodnot)
     * @param {string} firstPlayer - Player.Red nebo Player.Blue (kdo vybírá hodnoty)
     */
    setupSymmetricStart(firstPlayerValues, firstPlayer) {
      _nextDieId = 1;
      this.board.clear();
      this.dice = [];
      this.scores = { red: 0, blue: 0 };
      this.turnNumber = 1;
      this.winner = null;

      const secondPlayer = firstPlayer === Player.Red ? Player.Blue : Player.Red;
      const redBase = this.map.getBaseCells(Player.Red);
      const blueBase = this.map.getBaseCells(Player.Blue);
      const types = [DiceType.D6, DiceType.D6, DiceType.D6, DiceType.D6, DiceType.D6];

      // Nastav hodnoty pro oba hráče podle pořadí zadání
      for (let i = 0; i < 5; i++) {
        let redVal, blueVal;
        if (firstPlayer === Player.Red) {
          redVal = firstPlayerValues[i];
          blueVal = firstPlayerValues[i];
        } else {
          redVal = firstPlayerValues[i];
          blueVal = firstPlayerValues[i];
        }
        const rd = createDieWithValue(Player.Red, types[i], redVal);
        const bd = createDieWithValue(Player.Blue, types[i], blueVal);
        this._placeDie(rd, redBase[i].coord);
        this._placeDie(bd, blueBase[i].coord);
      }

      // Začíná hráč, který vybíral hodnoty jako druhý
      this.turn = secondPlayer;
    }
  constructor() {
    this.map = new HexMap();
    /** @type {Map<string, object[]>} klíč = hexKey → pole kostek */
    this.board = new Map();
    /** @type {object[]} všechny kostky */
    this.dice = [];
    this.scores = { red: 0, blue: 0 };
    this.turn = Player.Red;   // začíná hráč s nižším součtem (zjednodušeno: Red)
    this.turnNumber = 1;
    this.winner = null;
  }

  // ── Setup: rozmístění kostek na základny ──────────────────

  /**
   * Připraví hru: každý hráč dostane 5× D6 na svou základnu.
   * Kostky dostanou náhodné hodnoty.
   */
  setup() {
    _nextDieId = 1;
    this.board.clear();
    this.dice = [];
    this.scores = { red: 0, blue: 0 };
    this.turn = Player.Red;
    this.turnNumber = 1;
    this.winner = null;

    // Vygeneruj jednu sadu hodnot a použij pro oba hráče
    const values = [];
    for (let i = 0; i < 5; i++) {
      values.push(Math.floor(Math.random() * 6) + 1);
    }
    const redBase = this.map.getBaseCells(Player.Red);
    const blueBase = this.map.getBaseCells(Player.Blue);
    for (let i = 0; i < 5; i++) {
      const rd = createDieWithValue(Player.Red, DiceType.D6, values[i]);
      const bd = createDieWithValue(Player.Blue, DiceType.D6, values[i]);
      this._placeDie(rd, redBase[i].coord);
      this._placeDie(bd, blueBase[i].coord);
    }

    // Podle pravidel začíná hráč s nižším součtem
    const redSum = values.reduce((s, v) => s + v, 0);
    const blueSum = values.reduce((s, v) => s + v, 0);
    this.turn = redSum <= blueSum ? Player.Red : Player.Blue;
  }

  /**
   * Připraví hru s pevně danými hodnotami (pro testy).
   * redValues/blueValues = pole 5 hodnot [d6, d6, d6, d6, d6]
   */
  setupWithValues(redValues, blueValues) {
    _nextDieId = 1;
    this.board.clear();
    this.dice = [];
    this.scores = { red: 0, blue: 0 };
    this.turn = Player.Red;
    this.turnNumber = 1;
    this.winner = null;

    const redBase = this.map.getBaseCells(Player.Red);
    const blueBase = this.map.getBaseCells(Player.Blue);
    const types = [DiceType.D6, DiceType.D6, DiceType.D6, DiceType.D6, DiceType.D6];

    for (let i = 0; i < 5; i++) {
      const rd = createDieWithValue(Player.Red, types[i], redValues[i]);
      this._placeDie(rd, redBase[i].coord);
      const bd = createDieWithValue(Player.Blue, types[i], blueValues[i]);
      this._placeDie(bd, blueBase[i].coord);
    }

    const redSum = redValues.reduce((a, b) => a + b, 0);
    const blueSum = blueValues.reduce((a, b) => a + b, 0);
    this.turn = redSum <= blueSum ? Player.Red : Player.Blue;
  }

  // ── Board management ──────────────────────────────────────

  /** Umístí kostku na pole (interní). */
  _placeDie(die, coord) {
    this.dice.push(die);
    die.position = { q: coord.q, r: coord.r };
    const key = hexKey(coord);
    if (!this.board.has(key)) {
      this.board.set(key, []);
    }
    this.board.get(key).push(die);
  }

  /** Vrátí formaci (pole kostek) na daném poli, nebo prázdné pole. */
  getFormation(coord) {
    return this.board.get(hexKey(coord)) || [];
  }

  /** Je pole prázdné? */
  isEmpty(coord) {
    return this.getFormation(coord).length === 0;
  }

  /** Vrátí vlastníka pole (pokud samotná kostka nebo jednobarevná formace). */
  getFieldOwner(coord) {
    const f = this.getFormation(coord);
    if (f.length === 0) return null;
    return towerDominance(f);
  }

  /** Všechny živé kostky hráče. */
  getPlayerDice(player) {
    return this.dice.filter(d => d.owner === player && d.alive);
  }

  /** Najdi kostku podle ID. */
  getDieById(id) {
    return this.dice.find(d => d.id === id) || null;
  }

  /** Přesune kostku z jednoho pole na jiné. */
  moveDie(die, toCoord) {
    // Odeber ze starého pole
    const fromKey = hexKey(die.position);
    const fromArr = this.board.get(fromKey);
    if (fromArr) {
      const idx = fromArr.indexOf(die);
      if (idx !== -1) fromArr.splice(idx, 1);
      if (fromArr.length === 0) this.board.delete(fromKey);
    }
    // Přidej na nové pole
    die.position = { q: toCoord.q, r: toCoord.r };
    const toKey = hexKey(toCoord);
    if (!this.board.has(toKey)) this.board.set(toKey, []);
    this.board.get(toKey).push(die);
  }

  /** Odstraní kostku ze hry (zničena). */
  destroyDie(die) {
    die.alive = false;
    const key = hexKey(die.position);
    const arr = this.board.get(key);
    if (arr) {
      const idx = arr.indexOf(die);
      if (idx !== -1) arr.splice(idx, 1);
      if (arr.length === 0) this.board.delete(key);
    }
  }

  // ── Bodování ──────────────────────────────────────────────

  /** Přidej trvalé body za destrukci. */
  addDestructionPoints(player, points) {
    if (player === Player.Red) this.scores.red += points;
    else this.scores.blue += points;
  }

  /** Spočítej stavové body (ohniska) pro hráče. */
  focalPointsControlled(player) {
    let count = 0;
    for (const fp of this.map.getFocalPoints()) {
      const owner = this.getFieldOwner(fp.coord);
      if (owner === player) count++;
    }
    return count;
  }

  /** Celkové skóre hráče (trvalé + stavové). */
  totalScore(player) {
    const base = player === Player.Red ? this.scores.red : this.scores.blue;
    return base + this.focalPointsControlled(player);
  }

  /** Zkontroluje, zda aktivní hráč vyhrál. Pravidla: "Body získává pouze hráč na tahu." */
  checkWin() {
    const p = this.turn;
    if (this.totalScore(p) >= WINNING_SCORE) {
      this.winner = p;
    }
    return this.winner;
  }

  /**
   * Začátek tahu — volat na začátku každého tahu.
   * Zkontroluje výhru aktivního hráče (ohniska se počítají dynamicky).
   * Vrací { player, score, focalPoints, destructionPoints, winner? }
   */
  startTurn() {
    const p = this.turn;
    const fp = this.focalPointsControlled(p);
    const dp = p === Player.Red ? this.scores.red : this.scores.blue;
    const total = dp + fp;

    // Kontrola výhry na začátku tahu
    if (total >= WINNING_SCORE) {
      this.winner = p;
    }

    return {
      player: p,
      turnNumber: this.turnNumber,
      focalPoints: fp,
      destructionPoints: dp,
      score: total,
      winner: this.winner,
    };
  }

  /** Přepne tah na dalšího hráče. */
  endTurn() {
    // Po akci: zkontroluj okamžitou výhru (destrukce mohla přidat body)
    this.checkWin();
    if (this.winner) return;
    this.turn = opponent(this.turn);
    this.turnNumber++;
  }

  /** Vrací souhrn aktuálního skóre obou hráčů. */
  scoreSummary() {
    return {
      red: {
        destruction: this.scores.red,
        focalPoints: this.focalPointsControlled(Player.Red),
        total: this.totalScore(Player.Red),
      },
      blue: {
        destruction: this.scores.blue,
        focalPoints: this.focalPointsControlled(Player.Blue),
        total: this.totalScore(Player.Blue),
      }
    };
  }

}

// ═══════════════════════════════════════════════════════════════
// POHYB KOSTKOU (akce "Pohyb kostkou")
// ═══════════════════════════════════════════════════════════════

/**
 * Pravidla pohybu:
 * - Kostka skočí o 1 až X polí (X = její hodnota)
 * - Trajektorie nemusí být přímka — hráč volí cestu krok po kroku
 * - Přes soupeřovy jednotky NELZE skákat (blokují cestu)
 * - Přes vlastní jednotky LZE skákat jen pokud
 *   hodnota skákající kostky > obranná síla formace na tom poli
 * - Cílové pole: prázdné → přesun, vlastní → věž, nepřítel → střet
 * - Útočná síla = hodnota horní kostky + (vlastní−1) − soupeř
 * - Pokud je kostka součástí věže → oddělí se od ní
 */

/**
 * Najde všechny platné cesty pro pohyb kostky.
 * Vrací pole objektů { path: HexCoord[], target: HexCoord, isAttack: boolean }
 *
 * @param {GameState} gs  — stav hry
 * @param {object} die    — kostka, která se pohybuje
 * @returns {object[]}    — platné tahy
 */
function findValidMoves(gs, die) {
  const results = [];
  const maxSteps = die.value;
  const startKey = hexKey(die.position);

  // DFS: hledáme všechny cesty délky 1 až maxSteps
  // path = pole souřadnic (bez startu), visitedKeys = množina navštívených hexů na cestě
  function dfs(current, path, visitedKeys) {
    const neighbors = gs.map.getNeighbors(current);

    for (const cell of neighbors) {
      const nk = hexKey(cell.coord);

      // Nelze se vrátit na pole, které jsme už na této cestě prošli
      if (visitedKeys.has(nk)) continue;

      const formation = gs.getFormation(cell.coord);
      const isEnemyPresent = formation.some(d => d.owner !== die.owner);
      const isFriendlyPresent = formation.some(d => d.owner === die.owner);
      const isEmpty = formation.length === 0;

      // ── Soupeřova jednotka → blokuje pokračování ──
      if (isEnemyPresent) {
        // Můžeme sem skočit jako cíl (střet), ale POUZE pokud jsme silnější
        const defenseStr = formationAttackStrength(formation, opponent(die.owner));
        if (die.value > defenseStr) {
          results.push({
            path: [...path, cell.coord],
            target: cell.coord,
            isAttack: true,
          });
        }
        // Dál pokračovat přes nepřítele NELZE
        continue;
      }

      // ── Vlastní jednotka → zastavit vždy lze, přeskočit jen pokud silnější ──
      if (isFriendlyPresent) {
        const fieldStr = formationAttackStrength(formation, die.owner);
        // Zastavit na vlastním poli = vytvoření věže (pravidla neomezují hodnotou)
        results.push({
          path: [...path, cell.coord],
          target: cell.coord,
          isAttack: false,
        });
        // Přes vlastní jednotky lze přejít pouze pokud má kostka VYŠŠÍ útočnou sílu
        if (die.value <= fieldStr) {
          // Nelze pokračovat dál
          continue;
        }
        // Silnější → pokračovat dál (ale NEpřidávat znovu stop, to už je výše)
        const newPath = [...path, cell.coord];
        if (newPath.length < maxSteps) {
          const newVisited = new Set(visitedKeys);
          newVisited.add(nk);
          dfs(cell.coord, newPath, newVisited);
        }
        continue;
      }

      // ── Prázdné pole ──
      const newPath = [...path, cell.coord];

      // Zastavit zde je vždy platný tah
      results.push({
        path: newPath,
        target: cell.coord,
        isAttack: false,
      });

      // Pokračovat dál (pokud ještě máme kroky)
      if (newPath.length < maxSteps) {
        const newVisited = new Set(visitedKeys);
        newVisited.add(nk);
        dfs(cell.coord, newPath, newVisited);
      }
    }
  }

  const initialVisited = new Set();
  initialVisited.add(startKey);
  dfs(die.position, [], initialVisited);

  // Deduplikace: stejný cílový hex se může objevit přes různé cesty,
  // ale pro herní logiku nás zajímá hlavně cíl
  return results;
}

/**
 * Filtruje výsledky findValidMoves na unikátní cíle.
 *
 * Pro NE-útočné cíle: vrátí nejkratší cestu (není potřeba volit směr).
 * Pro ÚTOČNÉ cíle: vrátí všechny unikátní SMĚRY PŘÍCHODU (attackerFrom).
 *   → Hráč si může vybrat, z jaké strany zaútočit (= jakým směrem vytlačí).
 *   Každý výsledek útoku má navíc pole `approachDirections` se všemi variantami.
 */
function findValidTargets(gs, die) {
  const moves = findValidMoves(gs, die);

  // Skupiny podle cíle
  const groups = new Map(); // hexKey → move[]
  for (const move of moves) {
    const tk = hexKey(move.target);
    if (!groups.has(tk)) groups.set(tk, []);
    groups.get(tk).push(move);
  }

  const results = [];

  for (const [tk, movesForTarget] of groups) {
    const isAttack = movesForTarget[0].isAttack;

    if (!isAttack) {
      // Ne-útok: stačí nejkratší cesta
      let best = movesForTarget[0];
      for (const m of movesForTarget) {
        if (m.path.length < best.path.length) best = m;
      }
      results.push(best);
    } else {
      // Útok: seskupíme podle unikátního attackerFrom (předposl. krok)
      const byDirection = new Map(); // hexKey(attackerFrom) → move (nejkratší)
      for (const m of movesForTarget) {
        const from = m.path.length >= 2
          ? m.path[m.path.length - 2]
          : die.position;
        const fk = hexKey(from);
        if (!byDirection.has(fk) || m.path.length < byDirection.get(fk).path.length) {
          byDirection.set(fk, m);
        }
      }

      // Přidej je jako "approachDirections" k jednomu zástupci
      const approaches = [...byDirection.values()];

      if (approaches.length === 1) {
        // Jen jeden směr — prostě vrať
        results.push(approaches[0]);
      } else {
        // Více směrů — vrať hlavní záznam s polem variant
        const primary = approaches[0];
        primary.approachDirections = approaches.map(a => ({
          path: a.path,
          attackerFrom: a.path.length >= 2
            ? a.path[a.path.length - 2]
            : die.position,
        }));
        results.push(primary);
      }
    }
  }
  return results;
}

/**
 * Provede akci "Pohyb kostkou".
 * Vrací objekt s výsledkem: { success, reason?, attack?, target }
 *
 * NEŘEŠÍ střet — jen přesun. Střet se řeší zvlášť.
 */
/**
 * Provede akci "Pohyb kostkou".
 *
 * @param {GameState} gs
 * @param {object}    die          — kostka
 * @param {HexCoord}  targetCoord  — cíl
 * @param {HexCoord}  [approachFrom] — volitelně: z jakého sousedního pole
 *                                     přijít (pro výběr směru vytlačení).
 *                                     Pokud neuvedeno, použije se výchozí cesta.
 */
function executeMove(gs, die, targetCoord, approachFrom) {
  // Validace: kostka musí být navrchu věže nebo stát sama
  const startFormation = gs.getFormation(die.position);
  if (startFormation.length > 1 && topDie(startFormation) !== die) {
    return { success: false, reason: "Pohybovat se může jen kostka na vrcholu věže" };
  }

  // Validace: je to platný tah?
  const targets = findValidTargets(gs, die);
  const move = targets.find(m => hexEquals(m.target, targetCoord));

  if (!move) {
    return { success: false, reason: "Neplatný cíl pohybu" };
  }

  const formation = gs.getFormation(targetCoord);
  const isAttack = formation.some(d => d.owner !== die.owner);

  if (isAttack) {
    // Zjistit attackerFrom — buď explicitně zvolený, nebo výchozí
    let prevCoord;
    if (approachFrom) {
      // Ověřit, že tento směr je platný
      if (move.approachDirections) {
        const valid = move.approachDirections.find(
          a => hexEquals(a.attackerFrom, approachFrom)
        );
        if (!valid) {
          return { success: false, reason: "Neplatný směr příchodu" };
        }
        prevCoord = approachFrom;
      } else {
        // Jen jeden směr — ověř že souhlasí
        const defaultFrom = move.path.length >= 2
          ? move.path[move.path.length - 2]
          : die.position;
        if (!hexEquals(approachFrom, defaultFrom)) {
          return { success: false, reason: "Neplatný směr příchodu" };
        }
        prevCoord = approachFrom;
      }
    } else {
      // Výchozí: předposlední krok cesty
      prevCoord = move.path.length >= 2
        ? move.path[move.path.length - 2]
        : die.position;
    }

    return {
      success: true,
      attack: true,
      target: targetCoord,
      attacker: die,
      attackerFrom: prevCoord,
      defenders: [...formation],
      attackStrength: die.value,
      defenseStrength: formationAttackStrength(formation, opponent(die.owner)),
      path: move.path,
      approachDirections: move.approachDirections || null,
    };
  }

  // Přesun na prázdné nebo vlastní pole
  gs.moveDie(die, targetCoord);

  return {
    success: true,
    attack: false,
    target: targetCoord,
  };
}

// ═══════════════════════════════════════════════════════════════
// STŘET — FÁZE 1 (automatické následky) + FÁZE 2 (volba)
// ═══════════════════════════════════════════════════════════════

/**
 * Fáze 1: Automatické následky výhry.
 *  1) Opotřebení útočníka: hodnota útočící kostky se sníží o 1.
 *     Při útoku věží si hráč zvolí, která kostka obdrží opotřebení.
 *  2) Přehození obránce: všechny poražené kostky se přehodí.
 *
 * @param {object} attackerDie   — útočící kostka (nebo kostka z věže pro opotřebení)
 * @param {object[]} defenderDice — poražené kostky (na cílovém poli)
 * @returns {{ wearDie, oldValue, newDefenderValues }}
 */
function combatPhase1(attackerDie, defenderDice) {
  // Opotřebení útočníka (minimum 1 — D6 nemá stranu 0)
  const oldValue = attackerDie.value;
  attackerDie.value = Math.max(1, attackerDie.value - 1);

  // Přehození obránců (cap: nová hodnota ≤ stará → obránce nemůže zesílit)
  const oldDefValues = defenderDice.map(d => d.value);
  for (let i = 0; i < defenderDice.length; i++) {
    const def = defenderDice[i];
    const oldVal = oldDefValues[i];
    rerollDie(def);
    if (def.value > oldVal) {
      def.value = oldVal; // cap na původní hodnotu
    }
  }

  return {
    wearDie: attackerDie,
    oldAttackerValue: oldValue,
    newAttackerValue: attackerDie.value,
    oldDefenderValues: oldDefValues,
    newDefenderValues: defenderDice.map(d => d.value),
  };
}

/**
 * Fáze 2 — Varianta A: Vytlačení.
 *
 * Soupeřova formace se posune o 1 pole ve směru útoku.
 * Řetězový odsun: pokud za ní stojí další soupeřova formace, tlačí se dál.
 * Obklíčení/mimo mapu → zničení.
 *
 * @param {GameState} gs
 * @param {HexCoord}  attackerFrom  — pole odkud útočník přišel
 * @param {HexCoord}  targetCoord   — pole kde stojí obránce
 * @param {object}    attackerDie   — útočící kostka (pro přesun na cílové pole)
 * @returns {{ displaced, destroyed, points }}
 */
function combatDisplace(gs, attackerFrom, targetCoord, attackerDie) {
  // 1) Zjistit směr útoku
  const dir = getDirection(attackerFrom, targetCoord);
  if (dir === -1) {
    // Fallback: není přímý soused (nemělo by nastat při pohybu kostkou,
    // ale pohyb věže je vždy 1 pole)
    return { displaced: [], destroyed: [], points: 0, success: false, reason: "Nelze určit směr" };
  }

  // 2) Řetězové vytlačení — zpracovat pole po poli ve směru útoku
  const displaced = [];
  const destroyed = [];
  let totalPoints = 0;

  // Najdi řetězec formací ve směru útoku
  let currentCoord = targetCoord;
  const chain = []; // pole coord, kde každý má formaci k posunutí

  while (true) {
    const formation = gs.getFormation(currentCoord);
    if (formation.length === 0) break;

    // Je to soupeřova formace (nebo smíšená pod soupeřovou nadvládou)?
    const dom = towerDominance(formation);
    // Vytlačujeme formace protivníka útočníka
    if (dom === attackerDie.owner) break; // vlastní jednotka → obklíčení pro předchozí

    chain.push({ coord: { q: currentCoord.q, r: currentCoord.r }, formation: [...formation] });

    // Podívej se na další pole ve směru
    const nextCoord = hexNeighbor(currentCoord, dir);
    if (!gs.map.isValid(nextCoord)) {
      // Mimo mapu — poslední v řetězci bude zničen
      break;
    }

    const nextFormation = gs.getFormation(nextCoord);
    if (nextFormation.length === 0) break; // volné pole — sem se posune

    // Pokud na dalším poli stojí vlastní jednotka útočníka → obklíčení
    const nextDom = towerDominance(nextFormation);
    if (nextDom === attackerDie.owner) break;

    // Další soupeřova formace → pokračuj řetěz
    currentCoord = nextCoord;
  }

  // 3) Zpracuj řetěz od konce (poslední se posouvá první)
  for (let i = chain.length - 1; i >= 0; i--) {
    const entry = chain[i];
    const pushTo = hexNeighbor(entry.coord, dir);

    // Mimo mapu?
    if (!gs.map.isValid(pushTo)) {
      // ZNIČIT celou formaci — body jen za SOUPEŘOVY kostky
      for (const die of entry.formation) {
        if (die.owner !== attackerDie.owner) {
          totalPoints += dieDestructionPoints(die);
        }
        gs.destroyDie(die);
        destroyed.push(die);
      }
      continue;
    }

    // Obklíčení? (vlastní jednotka útočníka na cílovém poli)
    const pushToFormation = gs.getFormation(pushTo);
    if (pushToFormation.length > 0) {
      const pushToDom = towerDominance(pushToFormation);
      if (pushToDom === attackerDie.owner) {
        // ZNIČIT — obklíčen — body jen za SOUPEŘOVY kostky
        for (const die of entry.formation) {
          if (die.owner !== attackerDie.owner) {
            totalPoints += dieDestructionPoints(die);
          }
          gs.destroyDie(die);
          destroyed.push(die);
        }
        continue;
      }
    }

    // Volné pole (nebo pole kam se předchozí už odsunul) — posun
    for (const die of entry.formation) {
      gs.moveDie(die, pushTo);
      displaced.push(die);
    }
  }

  // 4) Přesuň útočníka na cílové pole (teď prázdné)
  gs.moveDie(attackerDie, targetCoord);

  // 5) Přidej body
  if (totalPoints > 0) {
    gs.addDestructionPoints(attackerDie.owner, totalPoints);
  }

  return { displaced, destroyed, points: totalPoints, success: true };
}

/**
 * Fáze 2 — Varianta B: Obsazení (nasednutí).
 *
 * Útočící kostka se umístí na vrchol nepřátelské formace.
 * Vzniká smíšená věž.
 *
 * @param {GameState} gs
 * @param {object}    attackerDie   — útočící kostka
 * @param {HexCoord}  targetCoord   — pole obránce
 * @returns {{ newDominance }}
 */
function combatOccupy(gs, attackerDie, targetCoord) {
  // Přesuň útočníka na vrchol formace
  gs.moveDie(attackerDie, targetCoord);

  // Nadvláda se přepočte automaticky (towerDominance zohledňuje součty)
  const formation = gs.getFormation(targetCoord);
  const newDominance = towerDominance(formation);

  return {
    success: true,
    newDominance,
    formation: [...formation],
  };
}

/**
 * Kompletní střet: Fáze 1 + Fáze 2.
 *
 * @param {GameState} gs
 * @param {object}    attackerDie    — útočící kostka
 * @param {HexCoord}  attackerFrom   — odkud přišla (pro směr vytlačení)
 * @param {HexCoord}  targetCoord    — cílové pole s nepřítelem
 * @param {"displace"|"occupy"} choice — volba útočníka pro fázi 2
 * @param {object}    [wearDie]      — kostka pro opotřebení (útok věží, jinak = attackerDie)
 * @returns {object}  výsledek
 */
function resolveCombat(gs, attackerDie, attackerFrom, targetCoord, choice, options) {
  options = options || {};
  const defFormation = gs.getFormation(targetCoord);
  // Útočná síla: explicitně předaná (věž/skok) nebo hodnota kostky
  const atkStr = options.attackStrength || attackerDie.value;
  const defStr = formationAttackStrength(defFormation, opponent(attackerDie.owner));
  const isTowerAttack = !!options.isTowerAttack;

  // Validace: útočná síla musí striktně převyšovat obranu
  if (atkStr <= defStr) {
    return { success: false, reason: "Útočná síla (" + atkStr + ") nepřevyšuje obranu (" + defStr + ")" };
  }

  // Validace: věž nemůže obsadit — jen vytlačit
  if (isTowerAttack && choice === "occupy") {
    return { success: false, reason: "Věž nemůže obsadit — pouze vytlačení" };
  }

  // FÁZE 1: Opotřebení + přehození
  const wearTarget = options.wearDie || attackerDie;
  const defenderDice = [...defFormation]; // kopie pole, kostky zůstávají
  const phase1 = combatPhase1(wearTarget, defenderDice);

  // FÁZE 2: Vytlačení nebo obsazení
  let phase2;
  if (choice === "displace") {
    phase2 = combatDisplace(gs, attackerFrom, targetCoord, attackerDie);
  } else {
    phase2 = combatOccupy(gs, attackerDie, targetCoord);
  }

  return {
    success: true,
    phase1,
    phase2,
    choice,
  };
}

// ═══════════════════════════════════════════════════════════════
// POHYB CELÉ VĚŽE (akce "Pohyb celé věže")
// ═══════════════════════════════════════════════════════════════
//
// Pravidla:
// - Celá věž (≥ 2 kostky) se přesune až o DOSAH polí.
//   Dosah = počet vlastních kostek − počet soupeřových (min 1).
// - Nadvládu má hráč s horní kostkou.
// - Útočná síla = hodnota horní + (vlastní−1) − soupeř.
// - Nesmí na/přes vlastní pole. Přes obsazené neprojde.
// - Cílové pole: prázdné → přesun, nepřítel → střet (jen displace).
//
// ═══════════════════════════════════════════════════════════════

/**
 * Najde platné cíle pro pohyb celé věže.
 *
 * @param {GameState} gs
 * @param {HexCoord}  towerCoord — pole kde věž stojí
 * @param {string}    player     — hráč, který táhne
 * @returns {{ targets: object[], reason?: string }}
 */
function findTowerMoveTargets(gs, towerCoord, player) {
  const formation = gs.getFormation(towerCoord);

  // Musí to být věž (≥ 2 kostky)
  if (formation.length < 2) {
    return { targets: [], reason: "Není věž (< 2 kostky)" };
  }

  // Hráč musí mít nadvládu
  const dom = towerDominance(formation);
  if (dom !== player) {
    return { targets: [], reason: "Nemáš nadvládu nad touto věží" };
  }

  // Dosah věže: počet vlastních − počet soupeřových (min 1)
  const maxSteps = towerReach(formation, player);

  // Útočná síla věže (nový vzorec)
  const towerStr = formationAttackStrength(formation, player);

  // BFS: věž prochází jen PRÁZDNÝMI poli; obsazená pole jsou buď cíl, nebo blok
  const visited = new Set();
  visited.add(hexKey(towerCoord));
  let frontier = [towerCoord];
  const targets = [];

  for (let step = 0; step < maxSteps; step++) {
    const next = [];
    for (const coord of frontier) {
      const neighbors = gs.map.getNeighbors(coord);
      for (const cell of neighbors) {
        const k = hexKey(cell.coord);
        if (!gs.map.isValid(cell.coord) || visited.has(k)) continue;
        visited.add(k);

        const targetFormation = gs.getFormation(cell.coord);

        if (targetFormation.length === 0) {
          // Prázdné pole → platný cíl + pokračuj BFS dál
          targets.push({
            target: cell.coord,
            isAttack: false,
            towerStrength: towerStr,
          });
          next.push(cell.coord);
        } else if (targetFormation.every(d => d.owner === player)) {
          // Vlastní formace → nesmí na ni ani přes ni (pravidla)
          // BLOK — nepokračovat
        } else {
          // Nepřítel → střet (jen pokud síla převyšuje obranu), nepokračovat dál
          const defStr = formationAttackStrength(targetFormation, opponent(player));
          if (towerStr > defStr) {
            targets.push({
              target: cell.coord,
              isAttack: true,
              towerStrength: towerStr,
              defenseStrength: defStr,
            });
          }
        }
      }
    }
    frontier = next;
  }

  return { targets };
}

/**
 * Provede pohyb celé věže o 1 pole.
 *
 * @param {GameState} gs
 * @param {HexCoord}  towerCoord — pole kde věž stojí
 * @param {HexCoord}  targetCoord — cílové sousední pole
 * @param {string}    player
 * @returns {object}
 */
function executeTowerMove(gs, towerCoord, targetCoord, player) {
  const { targets, reason } = findTowerMoveTargets(gs, towerCoord, player);
  if (reason) return { success: false, reason };

  const move = targets.find(t => hexEquals(t.target, targetCoord));
  if (!move) return { success: false, reason: "Neplatný cíl pro věž" };

  const formation = gs.getFormation(towerCoord);

  if (move.isAttack) {
    // Střet — vracíme info, útok se řeší externě přes resolveCombat
    return {
      success: true,
      attack: true,
      target: targetCoord,
      attackerFrom: towerCoord,
      towerFormation: [...formation],
      towerStrength: move.towerStrength,
      attackStrength: move.towerStrength,
      defenseStrength: move.defenseStrength,
      isTowerAttack: true,
    };
  }

  // Přesun celé věže (všechny kostky)
  const diceToMove = [...formation]; // kopie, moveDie mění pole
  for (const die of diceToMove) {
    gs.moveDie(die, targetCoord);
  }

  return {
    success: true,
    attack: false,
    target: targetCoord,
  };
}

// ═══════════════════════════════════════════════════════════════
// SKOK Z VĚŽE (akce "Skok z věže")
// ═══════════════════════════════════════════════════════════════
//
// Pravidla:
// - Z věže (≥ 2 kostky) skáče HORNÍ KOSTKA hráče.
// - Dosah skoku = počet vlastních − počet soupeřových (min 1).
// - Nadvládu má hráč s horní kostkou.
// - Útočná síla = hodnota horní + (vlastní−1) − soupeř (celé věže).
// - Po skoku kostka stojí na cílovém poli sama.
// - Cíl: prázdné/vlastní → přesun; nepřítel → střet (může i obsadit).
//
// ═══════════════════════════════════════════════════════════════

/**
 * Najde platné cíle pro skok z věže.
 *
 * @param {GameState} gs
 * @param {HexCoord}  towerCoord — pole kde věž stojí
 * @param {string}    player     — hráč, který táhne
 * @returns {{ targets, jumpDie, atkStrength, reason? }}
 */
function findTowerJumpTargets(gs, towerCoord, player) {
  const formation = gs.getFormation(towerCoord);

  if (formation.length < 2) {
    return { targets: [], reason: "Není věž (< 2 kostky)" };
  }

  // Na vrcholu musí být hráčova kostka
  const top = topDie(formation);
  if (top.owner !== player) {
    return { targets: [], reason: "Na vrcholu věže není tvá kostka" };
  }

  // Útočná síla = vzorec celé věže (horní + vlastní−1 − soupeř)
  const atkStrength = formationAttackStrength(formation, player);

  // Dosah skoku = počet vlastních − počet soupeřových (min 1)
  const maxSteps = towerReach(formation, player);

  // BFS: kostka skáče přes prázdná pole; obsazená blokují pokračování
  const visited = new Set();
  visited.add(hexKey(towerCoord));
  let frontier = [towerCoord];
  const targets = [];

  for (let step = 0; step < maxSteps; step++) {
    const next = [];
    for (const coord of frontier) {
      for (const cell of gs.map.getNeighbors(coord)) {
        const k = hexKey(cell.coord);
        if (!gs.map.isValid(cell.coord) || visited.has(k)) continue;
        visited.add(k);

        const targetFormation = gs.getFormation(cell.coord);

        if (targetFormation.length === 0) {
          // Prázdné → platný cíl + pokračuj BFS
          targets.push({ target: cell.coord, isAttack: false, attackStrength: atkStrength });
          next.push(cell.coord);
        } else if (targetFormation.every(d => d.owner === player)) {
          // Vlastní → vytvoří věž (pokud horní slabsi) + BLOK
          const topTarget = topDie(targetFormation);
          if (top.value > topTarget.value) {
            targets.push({ target: cell.coord, isAttack: false, attackStrength: atkStrength });
          }
        } else {
          // Nepřítel → střet (pokud silnější) + BLOK
          const defStr = formationAttackStrength(targetFormation, opponent(player));
          if (atkStrength > defStr) {
            targets.push({
              target: cell.coord,
              isAttack: true,
              attackStrength: atkStrength,
              defenseStrength: defStr,
            });
          }
        }
      }
    }
    frontier = next;
  }

  return { targets, jumpDie: top, attackStrength: atkStrength };
}

/**
 * Provede skok z věže.
 *
 * @param {GameState} gs
 * @param {HexCoord}  towerCoord  — pole věže
 * @param {HexCoord}  targetCoord — sousední cílové pole
 * @param {string}    player
 * @returns {object}
 */
function executeTowerJump(gs, towerCoord, targetCoord, player) {
  const { targets, jumpDie, attackStrength, reason } =
    findTowerJumpTargets(gs, towerCoord, player);
  if (reason) return { success: false, reason };

  const move = targets.find(t => hexEquals(t.target, targetCoord));
  if (!move) return { success: false, reason: "Neplatný cíl pro skok z věže" };

  if (move.isAttack) {
    // Střet — vracíme info
    return {
      success: true,
      attack: true,
      target: targetCoord,
      attackerFrom: towerCoord,
      jumpDie,
      attackStrength: move.attackStrength,
      defenseStrength: move.defenseStrength,
      isTowerAttack: false, // skok z věže MŮŽE obsadit
    };
  }

  // Přesun horní kostky na cílové pole
  gs.moveDie(jumpDie, targetCoord);

  return {
    success: true,
    attack: false,
    target: targetCoord,
    jumpDie,
  };
}

// ═══════════════════════════════════════════════════════════════
// ÚTĚK Z VĚŽE (akce "Útěk z věže")
// ═══════════════════════════════════════════════════════════════
//
// Pravidla:
// - Tvá kostka je na vrcholu věže.
// - Podmínka: hodnota kostky ≥ počet soupeřových kostek ve věži + 1.
// - Kostka seskočí na sousední pole (dosah 1).
// - Po útěku: hodnota klesne o počet soupeřových kostek (min 1).
// - Nelze zahájit střet — cíl musí být prázdné nebo vlastní pole.
//
// ═══════════════════════════════════════════════════════════════

/**
 * Najde platné cíle pro útěk z věže.
 *
 * @param {GameState} gs
 * @param {HexCoord}  towerCoord — pole kde věž stojí
 * @param {string}    player
 * @returns {{ targets: HexCoord[], escapeDie, cost, reason? }}
 */
function findEscapeTargets(gs, towerCoord, player) {
  const formation = gs.getFormation(towerCoord);

  if (formation.length < 2) {
    return { targets: [], reason: "Není věž (< 2 kostky)" };
  }

  const top = topDie(formation);
  if (top.owner !== player) {
    return { targets: [], reason: "Na vrcholu věže není tvá kostka" };
  }

  // Počet soupeřových kostek ve věži
  const enemyCount = formation.filter(d => d.owner !== player).length;
  if (enemyCount === 0) {
    return { targets: [], reason: "Ve věži nejsou soupeřovy kostky — použij normální pohyb" };
  }

  // Podmínka: hodnota ≥ enemyCount + 1
  if (top.value < enemyCount + 1) {
    return { targets: [], reason: "Hodnota kostky (" + top.value + ") < potřebná (" + (enemyCount + 1) + ") pro útěk" };
  }

  // Cíle: sousední prázdná nebo vlastní pole (bez střetu)
  const neighbors = gs.map.getNeighbors(towerCoord);
  const targets = [];

  for (const cell of neighbors) {
    const targetFormation = gs.getFormation(cell.coord);
    const hasEnemy = targetFormation.some(d => d.owner !== player);
    if (hasEnemy) continue; // nelze utéct na pole s nepřítelem

    if (targetFormation.length === 0) {
      targets.push(cell.coord);
    } else {
      // Vlastní formace — lze nasednout pokud hodnota (po snížení) > top
      const newValue = Math.max(1, top.value - enemyCount);
      const topTarget = topDie(targetFormation);
      if (newValue > topTarget.value) {
        targets.push(cell.coord);
      }
    }
  }

  if (targets.length === 0) {
    return { targets: [], reason: "Žádné volné sousední pole pro útěk" };
  }

  return { targets, escapeDie: top, cost: enemyCount };
}

/**
 * Provede útěk z věže.
 *
 * @param {GameState} gs
 * @param {HexCoord}  towerCoord  — pole věže
 * @param {HexCoord}  targetCoord — sousední cílové pole
 * @param {string}    player
 * @returns {object}
 */
function executeEscape(gs, towerCoord, targetCoord, player) {
  const { targets, escapeDie, cost, reason } = findEscapeTargets(gs, towerCoord, player);
  if (reason) return { success: false, reason };

  const isValid = targets.some(t => hexEquals(t, targetCoord));
  if (!isValid) return { success: false, reason: "Neplatný cíl pro útěk" };

  const oldValue = escapeDie.value;
  // Snížení hodnoty
  escapeDie.value = Math.max(1, escapeDie.value - cost);

  // Přesun kostky
  gs.moveDie(escapeDie, targetCoord);

  return {
    success: true,
    escapeDie,
    oldValue,
    newValue: escapeDie.value,
    cost,
    target: targetCoord,
  };
}

// ═══════════════════════════════════════════════════════════════
// PŘEFORMOVÁNÍ (akce)
// ═══════════════════════════════════════════════════════════════
//
// Pravidla:
// - Zvol libovolnou svou kostku (kdekoliv na desce).
// - Přehoď ji — pokud padne nižší hodnota, ponecháš původní (1 hod, max(starý, nový)).
// - Žádný pohyb. Tah končí.
//
// ═══════════════════════════════════════════════════════════════

/**
 * Provede přeformování kostky: hodí se JEDNOU.
 * Pokud padne nižší hodnota než původní, ponecháš PŮVODNÍ hodnotu.
 * Výsledek = max(starý, nový).
 *
 * @param {object} die — vlastní kostka
 * @returns {object}
 */
function executeReform(die) {
  const oldValue = die.value;
  rerollDie(die);
  const rolledValue = die.value;
  if (rolledValue < oldValue) {
    die.value = oldValue; // ponech původní
  }
  return {
    success: true,
    oldValue,
    newValue: die.value,
  };
}

// ═══════════════════════════════════════════════════════════════
// KOLAPS VĚŽE (akce)
// ═══════════════════════════════════════════════════════════════
//
// Pravidla:
// - Věž musí mít ≥ 3 kostky.
// - Pouze hráč, jehož kostka je na VRCHOLU věže, smí vyvolat kolaps.
// - Spodní (nejníže umístěná) kostka ve věži je automaticky odstraněna.
// - Soupeřova kostka → body za destrukci (D6=1, D8=2).
// - Vlastní kostka → bez bodů.
// - Tah končí.
//
// ═══════════════════════════════════════════════════════════════

/**
 * Najde věže, kde je možný kolaps.
 * Podmínka: ≥ 3 kostky, horní kostka patří hráči.
 *
 * @param {GameState} gs
 * @param {string}    player
 * @returns {{ towers: { coord, formation, bottomDie }[] }}
 */
function findCollapsibleTowers(gs, player) {
  const towers = [];

  for (const [key, formation] of gs.board) {
    if (formation.length < 3) continue;
    const dom = towerDominance(formation);
    if (dom !== player) continue;

    towers.push({
      coord: formation[0].position,
      formation: [...formation],
      bottomDie: bottomDie(formation), // automaticky spodní kostka
    });
  }

  return { towers };
}

/**
 * Provede kolaps věže — automaticky odstraní SPODNÍ kostku.
 *
 * @param {GameState} gs
 * @param {HexCoord}  towerCoord — pole věže
 * @param {string}    player — hráč provádějící kolaps
 * @returns {object}
 */
function executeCollapse(gs, towerCoord, player) {
  const formation = gs.getFormation(towerCoord);

  if (formation.length < 3) {
    return { success: false, reason: "Věž má méně než 3 kostky" };
  }

  const dom = towerDominance(formation);
  if (dom !== player) {
    return { success: false, reason: "Nemáš nadvládu nad touto věží" };
  }

  // Spodní kostka je automaticky odstraněna
  const dieToRemove = bottomDie(formation);

  // Odstraň kostku z desky
  gs.destroyDie(dieToRemove);

  // Body za soupeřovu kostku
  let points = 0;
  if (dieToRemove.owner !== player) {
    points = dieDestructionPoints(dieToRemove);
    gs.addDestructionPoints(player, points);
  }

  return {
    success: true,
    removedDie: dieToRemove,
    wasEnemy: dieToRemove.owner !== player,
    points,
    remainingFormation: gs.getFormation(towerCoord).length,
  };
}
// ═══════════════════════════════════════════════════════════════
// HOTOVO: Ověření v konzoli prohlížeče
// ═══════════════════════════════════════════════════════════════

const gameMap = new HexMap();
console.log("Pád Donjonu — mapa načtena");
console.log("Počet hexů:", gameMap.size); // 61
console.log("Červená základna:", gameMap.getBaseCells(Player.Red).length, "polí");
console.log("Modrá základna:", gameMap.getBaseCells(Player.Blue).length, "polí");
console.log("Ohniska:", gameMap.getFocalPoints().length);
console.log("\nMapa:");


console.log(gameMap.debugPrint());
