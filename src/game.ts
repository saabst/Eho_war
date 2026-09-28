import { T, fv } from "./theme";

export type Side = "player" | "enemy";
export type Owner = Side | null;
export type Kind = "plain" | "rock" | "source" | "fort" | "portal" | "mine" | "relic";
export type Level = "calm" | "hard";
export type Status = "playing" | "won" | "lost" | "draw";
export type Biome = "ash" | "ice" | "rust" | "blood";
export type Upgrade = "wall" | "forge" | "camp";
export type Cell = { owner: Owner; units: number; kind: Kind; used: boolean; link: number; up: Upgrade | null };
export type UndoItem = { i: number; cost: number; up?: Upgrade };
export type Pending =
  | { type: "coin"; id: number; side: Side; from: number; to: number; k: number; d: number; win: boolean }
  | { type: "mine"; id: number; side: Side; from: number; to: number; k: number };
export type Outcome = "win" | "lose" | "coin-win" | "coin-lose" | "move" | "mine-win" | "mine-lose";
export type Battle = { id: number; from: number; to: number; by: Side; k: number; d: number; outcome: Outcome };
export type LogItem = { id: number; who: Side | "system"; text: string };
export type Game = {
  cells: Cell[];
  cols: number;
  rows: number;
  homes: Record<Side, number>;
  biome: Biome;
  mapName: string;
  mapNo: number;
  round: number;
  phase: Side;
  status: Status;
  reason: string;
  pool: number;
  enemyPool: number;
  undo: UndoItem[];
  logs: LogItem[];
  battle: Battle | null;
  pending: Pending | null;
  flash: number[];
  recent: number[];
  nextId: number;
  seq: number;
  level: Level;
};

export const MAX_UNITS = 9;
export const ROUND_LIMIT = 20;
export const START_UNITS = 2;
export const RELIC_BONUS = 2;

const COSTS: Record<Upgrade, number> = { wall: 2, camp: 3, forge: 4 };
type UpgDef = { name: string; acc: string; cost: number; short: string; desc: string };
const mkUp = (u: Upgrade): UpgDef => ({
  cost: COSTS[u],
  get name() { return T.upgrades[u].name; },
  get acc() { return T.upgrades[u].acc; },
  get short() { return T.upgrades[u].short; },
  get desc() { return T.upgrades[u].desc; },
});
/** Названия зависят от выбранной темы, цены общие. */
export const UPGRADES: Record<Upgrade, UpgDef> = { wall: mkUp("wall"), camp: mkUp("camp"), forge: mkUp("forge") };
export const UPGRADE_LIST: Upgrade[] = ["wall", "camp", "forge"];
export const UPGRADE_MIN = 2;
const keptName = (k: Kind): string | undefined => (k === "source" || k === "fort" || k === "relic" || k === "portal" ? T.kinds[k] : undefined);

export const ochko = (n: number) => { const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? "очко" : m >= 2 && m <= 4 && (h < 12 || h > 14) ? "очка" : "очков"; };
const rand = (n: number) => Math.floor(Math.random() * n);
export const dims = (n: number) => (n === 36 ? { cols: 6, rows: 6 } : n === 42 ? { cols: 6, rows: 7 } : { cols: 7, rows: 7 });
export const coordinates = (i: number, cols: number) => `${"ABCDEFG"[i % cols]}${Math.floor(i / cols) + 1}`;
const at = (cells: Cell[], i: number) => coordinates(i, dims(cells.length).cols);

/** Бастион и стена дают защитнику +1 и остаются на клетке при любой смене владельца. */
export const bonusOf = (c: Cell) => (c.kind === "fort" ? 1 : 0) + (c.up === "wall" ? 1 : 0);
export const defense = (c: Cell) => c.units + bonusOf(c);
export const canUpgrade = (c: Cell, side: Side) => c.owner === side && !c.up && c.kind !== "rock" && c.kind !== "mine";
export const countUp = (cells: Cell[], side: Side, up: Upgrade) => cells.filter(c => c.owner === side && c.up === up).length;
export const canAct = (c: Cell, side: Side) => c.owner === side && !c.used && c.units >= 2;
export const countCells = (cells: Cell[], side: Side) => cells.filter(c => c.owner === side).length;
export const countUnits = (cells: Cell[], side: Side) => cells.reduce((s, c) => s + (c.owner === side ? c.units : 0), 0);
export const countSources = (cells: Cell[], side: Side) => cells.filter(c => c.owner === side && c.kind === "source").length;
export const countRelics = (cells: Cell[], side: Side) => cells.filter(c => c.owner === side && c.kind === "relic").length;
export const income = (cells: Cell[], side: Side) =>
  cells.reduce((s, c) => s + (c.owner === side ? 1 + (c.kind === "source" ? 1 : 0) + (c.kind === "relic" ? RELIC_BONUS : 0) + (c.up === "forge" ? 1 : 0) : 0), 0);

/** Соседи: 4 стороны (без скал) + парная клетка портала. */
export function nbrs(cells: Cell[], i: number): number[] {
  const { cols, rows } = dims(cells.length);
  const r = Math.floor(i / cols);
  const c = i % cols;
  const out: number[] = [];
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const rr = r + dr;
    const cc = c + dc;
    if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
    const j = rr * cols + cc;
    if (cells[j].kind !== "rock") out.push(j);
  }
  const l = cells[i].link;
  if (l >= 0 && cells[l].kind !== "rock") out.push(l);
  return out;
}

export type Forecast = "win" | "tie" | "lose" | "move" | "mine";
export function forecast(cells: Cell[], to: number, k: number, side: Side): Forecast {
  const t = cells[to];
  if (t.owner === side) return "move";
  if (t.kind === "mine") return "mine";
  const d = defense(t);
  return k > d ? "win" : k === d ? "tie" : "lose";
}

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

const blank = (n: number): Cell[] => Array.from({ length: n }, () => ({ owner: null, units: 0, kind: "plain" as Kind, used: false, link: -1, up: null }));

function bfs(cells: Cell[], from: number) {
  const dist: number[] = Array(cells.length).fill(-1);
  dist[from] = 0;
  const q = [from];
  for (let h = 0; h < q.length; h++) {
    for (const n of nbrs(cells, q[h])) if (dist[n] < 0) { dist[n] = dist[q[h]] + 1; q.push(n); }
  }
  return dist;
}

const BIOMES: Biome[] = ["ash", "ice", "rust", "blood"];

/** Случайная карта: размер, рельеф, порталы, мины и позиции баз каждый раз разные. Симметрична относительно центра. */
export function makeMap() {
  const SIZES = [{ cols: 6, rows: 6 }, { cols: 6, rows: 7 }, { cols: 7, rows: 7 }, { cols: 6, rows: 7 }];
  for (let tries = 0; tries < 400; tries++) {
    const { cols, rows } = SIZES[rand(SIZES.length)];
    const N = cols * rows;
    const cells = blank(N);
    const ph = (rows - 1 - rand(2)) * cols + rand(cols);
    const eh = N - 1 - ph;

    const near = new Set<number>([ph, ...nbrs(cells, ph)]);
    [...near].forEach(x => near.add(N - 1 - x));
    const pairs = shuffle(Array.from({ length: Math.floor(N / 2) }, (_, i) => i).filter(i => !near.has(i) && !near.has(N - 1 - i)));
    const put = (kind: Kind, units = 0) => {
      const i = pairs.pop();
      if (i === undefined) return;
      for (const j of [i, N - 1 - i]) { cells[j].kind = kind; cells[j].units = units; }
    };

    const mines = 1 + rand(2);
    for (let n = 0; n < mines; n++) put("mine");
    for (let n = 0; n < 1 + rand(2); n++) put("source", 2);
    for (let n = 0; n < 1 + rand(2); n++) put("fort", 1);
    for (let n = 0, m = Math.round(N / 14) + rand(2); n < m; n++) put("rock");
    for (let n = 0, m = 2 + rand(3); n < m; n++) put("plain", 1);
    if (Math.random() < 0.55 && pairs.length) {
      const i = pairs.pop()!;
      const j = N - 1 - i;
      cells[i].kind = cells[j].kind = "portal";
      cells[i].link = j; cells[j].link = i;
    }
    const c = (N - 1) / 2;
    if (N % 2 === 1 && !near.has(c)) {
      const r = Math.random();
      if (r < 0.5) cells[c].kind = "mine";
      else if (r < 0.75) { cells[c].kind = "source"; cells[c].units = 2; }
      else { cells[c].kind = "fort"; cells[c].units = 1; }
    }
    cells[ph].owner = "player"; cells[ph].units = START_UNITS;
    cells[eh].owner = "enemy"; cells[eh].units = START_UNITS;

    const dist = bfs(cells, ph);
    const ok = cells.every((cell, i) => cell.kind === "rock" || dist[i] >= 0) && dist[eh] >= 5;
    if (!ok) continue;
    const biome = BIOMES[rand(BIOMES.length)];
    return { cells, cols, rows, homes: { player: ph, enemy: eh } as Record<Side, number>, biome, name: T.places[rand(T.places.length)] };
  }
  const cells = blank(36);
  cells[30].owner = "player"; cells[30].units = START_UNITS;
  cells[5].owner = "enemy"; cells[5].units = START_UNITS;
  return { cells, cols: 6, rows: 6, homes: { player: 30, enemy: 5 } as Record<Side, number>, biome: "ash" as Biome, name: T.places[0] };
}

export function newGame(level: Level = "calm"): Game {
  const m = makeMap();
  return {
    cells: m.cells, cols: m.cols, rows: m.rows, homes: m.homes, biome: m.biome, mapName: m.name,
    mapNo: 1000 + rand(9000), round: 1, phase: "player", status: "playing", reason: "",
    pool: income(m.cells, "player"), enemyPool: 0, undo: [],
    logs: [{ id: 0, who: "system", text: T.start }],
    battle: null, pending: null, flash: [], recent: [], nextId: 1, seq: 0, level,
  };
}

function pushLog(g: Game, who: LogItem["who"], text: string): Game {
  return { ...g, nextId: g.nextId + 1, logs: [{ id: g.nextId, who, text }, ...g.logs].slice(0, 12) };
}

export function reinforce(g: Game, side: Side, i: number): Game {
  if (g.status !== "playing" || g.phase !== side || g.pending) return g;
  const pool = side === "player" ? g.pool : g.enemyPool;
  const c = g.cells[i];
  if (!c || pool < 1 || c.owner !== side || c.units >= MAX_UNITS) return g;
  const cells = g.cells.map(x => ({ ...x }));
  cells[i].units += 1;
  const next: Game = { ...g, cells, flash: [i] };
  if (side === "player") { next.pool = g.pool - 1; next.undo = [...g.undo, { i, cost: 1 }]; }
  else { next.enemyPool = g.enemyPool - 1; next.recent = [...g.recent, i]; }
  return next;
}

/** Строит улучшение на своей клетке за очки усиления. Одно улучшение на клетку. */
export function upgradeCell(g: Game, side: Side, i: number, up: Upgrade): Game {
  if (g.status !== "playing" || g.phase !== side || g.pending) return g;
  const cost = UPGRADES[up].cost;
  const pool = side === "player" ? g.pool : g.enemyPool;
  if (pool < cost || !g.cells[i] || !canUpgrade(g.cells[i], side)) return g;
  const cells = g.cells.map(x => ({ ...x }));
  cells[i].up = up;
  const next: Game = { ...g, cells, flash: [i] };
  if (side === "player") { next.pool = g.pool - cost; next.undo = [...g.undo, { i, cost, up }]; }
  else { next.enemyPool = g.enemyPool - cost; next.recent = [...g.recent, i]; }
  return pushLog(next, side, `${whoName(side)} ${side === "player" ? "построили" : fv("построила", "построил")} ${UPGRADES[up].acc} на ${at(cells, i)}`);
}

/** Автоматически раздаёт все оставшиеся очки игрока. */
export function autoReinforce(g: Game): Game {
  let cur = g;
  for (let n = 0; n < 80 && cur.pool > 0; n++) {
    const i = aiPlace(cur.cells, cur.pool, "player", "hard");
    if (i === null) break;
    const next = reinforce(cur, "player", i);
    if (next === cur) break;
    cur = next;
  }
  return cur;
}

/** Отменяет последнее вложение очков (боец или улучшение) и возвращает очки. */
export function undoLast(g: Game): Game {
  if (g.status !== "playing" || g.phase !== "player" || !g.undo.length || g.pending) return g;
  const it = g.undo[g.undo.length - 1];
  const cells = g.cells.map(x => ({ ...x }));
  if (it.up) cells[it.i].up = null;
  else cells[it.i].units -= 1;
  return { ...g, cells, pool: g.pool + it.cost, undo: g.undo.slice(0, -1), flash: [it.i] };
}

const whoName = (side: Side) => (side === "player" ? "Вы" : T.foe);

function eliminate(g: Game, side: Side): Game {
  const foe: Side = side === "player" ? "enemy" : "player";
  if (countCells(g.cells, foe) > 0) return g;
  return pushLog({
    ...g, status: side === "player" ? "won" : "lost",
    reason: side === "player" ? `Вы захватили все клетки ${T.foeGen}.` : `${T.foe} ${fv("захватила", "захватил")} все ваши клетки.`,
  }, "system", side === "player" ? T.finish : T.id === "front" ? "Ваши позиции потеряны." : "Ваш свет погас.");
}

function fight(g: Game, side: Side, to: number, k: number, d: number, win: boolean, coin: boolean): Game {
  const cells = g.cells.map(x => ({ ...x }));
  const t = cells[to];
  const place = at(cells, to);
  const who = whoName(side);
  let text: string;
  if (win) {
    t.owner = side;
    t.units = Math.min(MAX_UNITS, coin ? 1 : k - d);
    t.used = true;
    const luck = coin ? (side === "player" ? " — монета за вас" : ` — монета за ${T.id === "front" ? "противника" : "тьму"}`) : "";
    const kept = [keptName(t.kind), t.up ? UPGRADES[t.up].name.toLowerCase() : null].filter(Boolean);
    text = `${who} ${side === "player" ? "захватили" : fv("захватила", "захватил")} ${place}${luck}${kept.length ? ` · остаётся: ${kept.join(", ")}` : ""}`;
  } else {
    t.units = Math.max(1, t.units - k);
    text = side === "player"
      ? `Атака на ${place} отбита${coin ? " — монета не в вашу пользу" : ""}`
      : `${T.foe} не ${fv("смогла", "смог")} взять ${place}${coin ? " — монета на вашей стороне" : ""}`;
  }
  const outcome: Outcome = coin ? (win ? "coin-win" : "coin-lose") : win ? "win" : "lose";
  const seq = g.seq + 1;
  const src = g.battle?.from ?? to;
  const next = pushLog({
    ...g, cells, pending: null, seq, flash: [to],
    battle: { id: seq, from: src, to, by: side, k, d, outcome },
    recent: side === "enemy" ? [...g.recent, to] : g.recent,
  }, side, text);
  return eliminate(next, side);
}

export function attack(g: Game, side: Side, from: number, to: number, kIn: number): Game {
  if (g.status !== "playing" || g.phase !== side || g.pending) return g;
  const src = g.cells[from];
  if (!src || !g.cells[to] || !canAct(src, side) || !nbrs(g.cells, from).includes(to)) return g;
  const t0 = g.cells[to];
  if (t0.kind === "rock") return g;
  let k = Math.max(1, Math.min(kIn, src.units - 1));
  if (t0.owner === side) k = Math.min(k, MAX_UNITS - t0.units);
  if (k < 1) return g;

  const cells = g.cells.map(x => ({ ...x }));
  cells[from].units -= k;
  cells[from].used = true;
  const seq = g.seq + 1;
  const base: Game = {
    ...g, cells, undo: [], seq, flash: [to],
    battle: { id: seq, from, to, by: side, k, d: 0, outcome: "move" },
  };
  const place = at(cells, to);
  const who = whoName(side);

  if (t0.owner === side) {
    cells[to].units += k;
    cells[to].used = true;
    return pushLog(base, side, `${who} ${side === "player" ? "переместили" : fv("переместила", "переместил")} ${k} в ${place}`);
  }
  if (t0.kind === "mine") {
    return pushLog({ ...base, pending: { type: "mine", id: seq, side, from, to, k } }, side,
      side === "player" ? `Сапёры вошли на ${place}` : `${T.foe} ${fv("отправила", "отправил")} сапёров на ${place}`);
  }
  const d = defense(t0);
  if (k === d) {
    return pushLog({ ...base, pending: { type: "coin", id: seq, side, from, to, k, d, win: Math.random() < 0.5 } }, side,
      `Силы равны (${k} против ${d}) на ${place} — бросается монета`);
  }
  return fight(base, side, to, k, d, k > d, false);
}

/** Завершает бой после броска монеты. */
export function resolveCoin(g: Game): Game {
  const p = g.pending;
  if (!p || p.type !== "coin") return g;
  return fight({ ...g, pending: null, battle: { id: p.id, from: p.from, to: p.to, by: p.side, k: p.k, d: p.d, outcome: "move" } },
    p.side, p.to, p.k, p.d, p.win, true);
}

/** Завершает разминирование. */
export function resolveMine(g: Game, success: boolean): Game {
  const p = g.pending;
  if (!p || p.type !== "mine") return g;
  const cells = g.cells.map(x => ({ ...x }));
  const t = cells[p.to];
  const place = at(cells, p.to);
  let text: string;
  if (success) {
    t.owner = p.side; t.units = p.k; t.kind = "relic"; t.used = true;
    text = p.side === "player"
      ? `Вы разминировали ${place}: ${T.kinds.relic} ваша${T.id === "front" ? "" : ""} (+${RELIC_BONUS} очка ${T.id === "front" ? "в сутки" : "в раунд"})`
      : `${T.foe} ${fv("разминировала", "разминировал")} ${place} и ${fv("получила", "получил")} ${T.kinds.relic === "высота" ? "высоту" : T.kinds.relic === "реликвия" ? "реликвию" : T.kinds.relic}`;
  } else {
    text = p.side === "player"
      ? `Подрыв на ${place}: отряд из ${p.k} потерян`
      : `${T.foe} ${fv("подорвалась", "подорвался")} на ${place} и ${fv("потеряла", "потерял")} ${p.k}`;
  }
  return pushLog({
    ...g, cells, pending: null, flash: [p.to],
    battle: { id: p.id, from: p.from, to: p.to, by: p.side, k: p.k, d: 0, outcome: success ? "mine-win" : "mine-lose" },
    recent: p.side === "enemy" ? [...g.recent, p.to] : g.recent,
  }, p.side, text);
}

/** Казармы добавляют бойца в свою клетку в начале хода владельца. */
function applyCamps(cells: Cell[], side: Side): number[] {
  const got: number[] = [];
  cells.forEach((c, i) => {
    if (c.owner === side && c.up === "camp" && c.units < MAX_UNITS) { c.units += 1; got.push(i); }
  });
  return got;
}

export function endTurn(g: Game): Game {
  if (g.phase !== "player" || g.status !== "playing" || g.pending) return g;
  const cells = g.cells.map(c => ({ ...c, used: false }));
  // Финальный раунд: последнее слово за игроком, тьма уже не отвечает.
  if (g.round >= ROUND_LIMIT) return judge(g, cells);
  const camps = applyCamps(cells, "enemy");
  const gain = income(cells, "enemy");
  return { ...g, cells, phase: "enemy", undo: [], recent: camps, flash: [], enemyPool: g.enemyPool + gain };
}

/** Итог по лимиту раундов: больше клеток, затем больше бойцов. */
function judge(g: Game, cells: Cell[]): Game {
  const pc = countCells(cells, "player");
  const ec = countCells(cells, "enemy");
  const pu = countUnits(cells, "player");
  const eu = countUnits(cells, "enemy");
  let status: Status;
  let reason: string;
  if (pc !== ec) { status = pc > ec ? "won" : "lost"; reason = `${T.id === "front" ? "Сутки" : "Раунды"} закончились. Клеток: у вас ${pc}, у ${T.foeGen} ${ec}.`; }
  else if (pu !== eu) { status = pu > eu ? "won" : "lost"; reason = `${T.id === "front" ? "Сутки" : "Раунды"} закончились, клеток поровну. Бойцов: у вас ${pu}, у ${T.foeGen} ${eu}.`; }
  else { status = "draw"; reason = T.drawReason; }
  return pushLog({ ...g, cells, status, reason, undo: [], flash: [] }, "system", T.id === "front" ? "Сутки закончились." : "Раунды закончились.");
}

function finishRound(g: Game): Game {
  const cells = g.cells.map(c => ({ ...c, used: false }));
  if (g.round >= ROUND_LIMIT) return judge(g, cells);
  const camps = applyCamps(cells, "player");
  const gain = income(cells, "player");
  return pushLog({ ...g, cells, round: g.round + 1, phase: "player", pool: g.pool + gain, flash: camps },
    "system", `${T.round} ${g.round + 1}: +${gain} ${ochko(gain)} ${T.pointsName}${camps.length ? `, ${T.upgrades.camp.name.toLowerCase()}: +${camps.length}` : ""}`);
}

/* ---------------- Тьма ---------------- */

function value(cells: Cell[], t: Cell, side: Side) {
  const foe: Side = side === "player" ? "enemy" : "player";
  let v = t.owner === foe ? 2.6 : t.units > 0 ? 1.6 : 1;
  if (t.kind === "source") v += 3;
  if (t.kind === "relic") v += 3;
  if (t.kind === "mine") v += 2.4;
  if (t.kind === "fort") v += 0.6;
  if (t.up === "forge") v += 2.2;
  if (t.up === "camp") v += 1.4;
  if (t.up === "wall") v += 0.5;
  if (t.kind === "portal") v += 0.4;
  if (t.owner === foe && countCells(cells, foe) === 1) v += 100;
  return v;
}

type Place = { i: number; tag: "attack" | "defend" | "front" | "any" };

function placeInfo(cells: Cell[], pool: number, side: Side, level: Level): Place | null {
  const foe: Side = side === "player" ? "enemy" : "player";
  const own: number[] = [];
  cells.forEach((c, i) => { if (c.owner === side && c.units < MAX_UNITS) own.push(i); });
  if (!own.length) return null;
  const rnd = own[rand(own.length)];
  if (level === "calm" && Math.random() < 0.3) return { i: rnd, tag: "any" };

  let best = -1;
  let bs = -Infinity;
  for (const i of own) {
    const c = cells[i];
    for (const j of nbrs(cells, i)) {
      const t = cells[j];
      if (t.owner === side || t.kind === "mine") continue;
      const need = defense(t) + 1 - (c.units - 1);
      if (need > 0 && need <= pool && c.units + need <= MAX_UNITS) {
        const s = value(cells, t, side) + 4 - need * 0.4;
        if (s > bs) { bs = s; best = i; }
      }
    }
  }
  if (best >= 0) return { i: best, tag: "attack" };

  for (const i of own) {
    const c = cells[i];
    let threat = 0;
    for (const j of nbrs(cells, i)) if (cells[j].owner === foe) threat = Math.max(threat, cells[j].units - 1);
    const s = threat - defense(c);
    if (threat > 0 && s >= -1 && s > bs) { bs = s; best = i; }
  }
  if (best >= 0) return { i: best, tag: "defend" };

  bs = -Infinity;
  for (const i of own) {
    const c = cells[i];
    const front = nbrs(cells, i).some(j => cells[j].owner !== side);
    const s = (front ? 5 : 0) + c.units + (c.units === 1 && front ? 3 : 0) + Math.random();
    if (s > bs) { bs = s; best = i; }
  }
  return { i: best >= 0 ? best : rnd, tag: "front" };
}

/** Куда добавить бойца (без улучшений). Используется и для кнопки «Авто». */
export function aiPlace(cells: Cell[], pool: number, side: Side, level: Level): number | null {
  return placeInfo(cells, pool, side, level)?.i ?? null;
}

export type Plan = { type: "unit"; i: number } | { type: "up"; i: number; up: Upgrade };

function aiUpgrade(cells: Cell[], pool: number, side: Side, level: Level, round: number): Plan | null {
  if (pool < UPGRADE_MIN || Math.random() > (level === "hard" ? 0.6 : 0.3)) return null;
  const foe: Side = side === "player" ? "enemy" : "player";
  const mine = cells.map((c, i) => ({ c, i })).filter(x => canUpgrade(x.c, side));
  if (!mine.length) return null;
  const front = (i: number) => nbrs(cells, i).some(j => cells[j].owner !== side);
  const threat = (i: number) => Math.max(0, ...nbrs(cells, i).filter(j => cells[j].owner === foe).map(j => cells[j].units - 1));

  const danger = mine.filter(x => threat(x.i) > 0 && threat(x.i) >= defense(x.c) - 1).sort((a, b) => threat(b.i) - threat(a.i));
  if (danger.length && Math.random() < 0.7) return { type: "up", i: danger[0].i, up: "wall" };

  if (pool >= 4 && countUp(cells, side, "forge") < 2 && round <= 14) {
    const safe = mine.filter(x => !front(x.i));
    if (safe.length) return { type: "up", i: safe[rand(safe.length)].i, up: "forge" };
  }
  if (pool >= 3 && countUp(cells, side, "camp") < 2 && round <= 16) {
    const fr = mine.filter(x => front(x.i) && x.c.units >= 2);
    if (fr.length) return { type: "up", i: fr[rand(fr.length)].i, up: "camp" };
  }
  return null;
}

/** Решение тьмы: усилить клетку или построить улучшение. Атаку на слабую цель не откладывает. */
export function aiPlan(cells: Cell[], pool: number, side: Side, level: Level, round: number): Plan | null {
  const p = placeInfo(cells, pool, side, level);
  if (p && p.tag === "attack") return { type: "unit", i: p.i };
  const up = aiUpgrade(cells, pool, side, level, round);
  if (up) return up;
  return p ? { type: "unit", i: p.i } : null;
}

export function aiAttack(cells: Cell[], side: Side, level: Level): { from: number; to: number; k: number } | null {
  let best: { from: number; to: number; k: number; score: number } | null = null;
  cells.forEach((c, i) => {
    if (!canAct(c, side)) return;
    const kmax = c.units - 1;
    for (const j of nbrs(cells, i)) {
      const t = cells[j];
      if (t.owner === side) continue;
      const d = defense(t);
      const v = value(cells, t, side);
      let p: number;
      let k: number;
      if (t.kind === "mine") { p = level === "hard" ? 0.7 : 0.5; k = 1; }
      else if (kmax > d) { p = 1; k = Math.min(kmax, d + 1 + (d === 0 ? 1 : 0)); }
      else if (kmax === d && level === "hard" && v >= 2.5) { p = 0.5; k = kmax; }
      else continue;
      const score = p * v - (1 - p) * k * 0.8 - (k - 1) * 0.15 + Math.random() * (level === "calm" ? 1.2 : 0.3);
      if (score > 0.4 && (!best || score > best.score)) best = { from: i, to: j, k, score };
    }
  });
  return best;
}

/** Один шаг тьмы. Вызывается по таймеру, пока у неё есть действия. */
export function enemyStep(g: Game): Game {
  if (g.phase !== "enemy" || g.status !== "playing" || g.pending) return g;
  if (g.enemyPool > 0) {
    const plan = aiPlan(g.cells, g.enemyPool, "enemy", g.level, g.round);
    if (plan) {
      const n = plan.type === "unit" ? reinforce(g, "enemy", plan.i) : upgradeCell(g, "enemy", plan.i, plan.up);
      if (n !== g) return n;
    }
  }
  const mv = aiAttack(g.cells, "enemy", g.level);
  if (mv) {
    let n = attack(g, "enemy", mv.from, mv.to, mv.k);
    if (n === g) return finishRound(g);
    if (n.pending?.type === "mine") n = resolveMine(n, Math.random() < (g.level === "hard" ? 0.7 : 0.5));
    return n;
  }
  return finishRound(g);
}
