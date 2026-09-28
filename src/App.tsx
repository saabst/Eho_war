import { useEffect, useMemo, useRef, useState } from "react";
import {
  MAX_UNITS, RELIC_BONUS, ROUND_LIMIT, UPGRADES, UPGRADE_LIST, UPGRADE_MIN,
  attack, autoReinforce, canAct, canUpgrade, coordinates, countCells, countRelics, countSources, countUnits, countUp,
  endTurn, enemyStep, forecast, income, nbrs, newGame, reinforce, resolveCoin, resolveMine, undoLast, upgradeCell,
  type Forecast, type Game, type Level, type Upgrade,
} from "./game";
import {
  Arrow, Bolt, Chevron, Chevrons, Crag, Crystal, Eclipse, Gate, Help, MineIcon, Minus, Plus, Restart, Sigil, Sword, Tower, Undo,
} from "./icons";
import { TileFace, UpgradeGlyph } from "./Tile";
import Tutorial from "./Tutorial";
import CoinToss from "./Coin";
import Minesweeper from "./Minesweeper";
import { T, THEMES, setTheme, type ThemeId } from "./theme";

const GUIDE_KEY = "echo-guide-v5";
const DOCK_KEY = "echo-dock";
type Mode = "reinforce" | "attack" | "upgrade";
type Tone = "info" | "enemy" | "warn";

const plural = (n: number, a: string, b: string, c: string) => {
  const m = n % 10, h = n % 100;
  return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 12 || h > 14) ? b : c;
};
const buzz = (p: number | number[]) => { try { navigator.vibrate?.(p); } catch { /* ignore */ } };
const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };
const THEME_KEY = "echo-theme";
const initialTheme: ThemeId = read(THEME_KEY) === "front" ? "front" : "gothic";
setTheme(initialTheme);

export default function App() {
  const [level, setLevel] = useState<Level>("calm");
  const [theme, setThemeState] = useState<ThemeId>(initialTheme);
  const [menuTheme, setMenuTheme] = useState<ThemeId>(initialTheme);
  setTheme(theme);
  const [game, setGame] = useState<Game>(() => newGame("calm"));
  const [selected, setSelected] = useState<number | null>(null);
  const [send, setSend] = useState(1);
  const [mode, setMode] = useState<Mode>("reinforce");
  const [menu, setMenu] = useState(false);
  const [dockOpen, setDockOpen] = useState(() => {
    const v = read(DOCK_KEY);
    // На очень низких экранах панель по умолчанию свёрнута, чтобы не закрывать поле.
    return v === null ? (typeof innerHeight === "number" ? innerHeight >= 680 : true) : v !== "0";
  });
  const [guide, setGuide] = useState(() => !read(GUIDE_KEY));
  const appRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  // Высота нижней панели нужна странице, чтобы панель никогда не закрывала поле.
  useEffect(() => {
    const el = dockRef.current;
    const app = appRef.current;
    if (!el || !app) return;
    const set = () => app.style.setProperty("--dock-h", `${el.offsetHeight}px`);
    set();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => { document.title = T.appTitle; }, [theme]);

  // Ход противника: по одному действию, чтобы было видно, что она делает.
  useEffect(() => {
    if (game.phase !== "enemy" || game.status !== "playing" || game.pending) return;
    const t = setTimeout(() => setGame(g => enemyStep(g)), game.enemyPool > 0 ? 300 : 760);
    return () => clearTimeout(t);
  }, [game]);

  // Новый раунд: снова режим усиления.
  useEffect(() => {
    setSelected(null);
    if (game.phase === "player") setMode(game.pool > 0 ? "reinforce" : "attack");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.round, game.mapNo]);

  const { cells, cols, rows, pending } = game;
  const playing = game.status === "playing";
  const myTurn = playing && game.phase === "player" && !pending;
  const finalRound = playing && game.round >= ROUND_LIMIT;
  const effMode: Mode =
    mode === "reinforce" && game.pool < 1 ? "attack"
    : mode === "upgrade" && game.pool < UPGRADE_MIN ? "attack"
    : mode;
  const pc = countCells(cells, "player");
  const ec = countCells(cells, "enemy");
  const pu = countUnits(cells, "player");
  const eu = countUnits(cells, "enemy");
  const gain = income(cells, "player");
  const sources = countSources(cells, "player");
  const relics = countRelics(cells, "player");
  const forges = countUp(cells, "player", "forge");

  const src = selected !== null ? cells[selected] : null;
  const k = src ? Math.max(1, Math.min(send, src.units - 1)) : 0;
  const targets = useMemo(() => (selected !== null ? nbrs(cells, selected) : []), [cells, selected]);
  const anyReady = cells.some(c => canAct(c, "player"));
  const canAdd = cells.some(c => c.owner === "player" && c.units < MAX_UNITS);
  const partner = selected !== null && cells[selected].link >= 0 ? cells[selected].link : -1;

  function pick(i: number) {
    setSelected(i);
    setSend(cells[i].units - 1);
    buzz(6);
  }
  function changeMode(m: Mode) {
    setMode(m);
    setSelected(null);
  }
  function onTile(i: number) {
    if (!myTurn) return;
    const c = cells[i];
    if (effMode === "reinforce") {
      if (c.owner !== "player") return;
      const next = reinforce(game, "player", i);
      if (next !== game) {
        setGame(next);
        buzz(8);
        if (next.pool === 0) setMode("attack");
      }
      return;
    }
    if (effMode === "upgrade") {
      if (c.owner === "player") { setSelected(i === selected ? null : i); buzz(6); }
      return;
    }
    if (selected === null) {
      if (canAct(c, "player")) pick(i);
      return;
    }
    if (i === selected) { setSelected(null); return; }
    if (targets.includes(i) && c.kind !== "rock") {
      if (c.owner === "player" && c.units >= MAX_UNITS) return;
      const next = attack(game, "player", selected, i, k);
      if (next !== game) { setGame(next); buzz(14); }
      setSelected(null);
      return;
    }
    if (canAct(c, "player")) pick(i);
    else setSelected(null);
  }
  function doUpgrade(u: Upgrade) {
    if (!myTurn || selected === null) return;
    const next = upgradeCell(game, "player", selected, u);
    if (next === game) return;
    setGame(next);
    setSelected(null);
    buzz(14);
    if (next.pool < UPGRADE_MIN) setMode(next.pool > 0 ? "reinforce" : "attack");
  }
  function auto() {
    setGame(autoReinforce(game));
    setMode("attack");
    buzz(10);
  }
  function finishTurn() {
    if (!myTurn) return;
    setGame(endTurn(game));
    setSelected(null);
  }
  function startNew(l: Level = level, th: ThemeId = menuTheme) {
    setTheme(th);
    setThemeState(th);
    write(THEME_KEY, th);
    setLevel(l);
    setGame(newGame(l));
    setSelected(null);
    setMode("reinforce");
    setMenu(false);
  }
  function closeGuide() {
    setGuide(false);
    write(GUIDE_KEY, "1");
  }
  function toggleDock() {
    setDockOpen(o => { write(DOCK_KEY, o ? "0" : "1"); return !o; });
  }

  /* ---------- Подсказка ---------- */
  const cellUp = src?.up ? UPGRADES[src.up] : null;
  const pts = T.pointsName;
  let coach: { tone: Tone; title: string; text: string };
  if (!playing) coach = { tone: "info", title: T.id === "front" ? "Операция окончена" : "Битва окончена", text: game.reason };
  else if (pending) coach = { tone: "warn", title: pending.type === "coin" ? "Летит монета" : "Разминирование", text: "Подождите, судьба решается." };
  else if (game.phase === "enemy") coach = { tone: "enemy", title: T.foeTurn, text: `${T.foe} усиливает клетки, строит и атакует. Красное свечение — ${T.fem ? "её" : "его"} последние ходы.` };
  else if (effMode === "reinforce") {
    coach = {
      tone: "info", title: `Раздайте очки · ${game.pool}`,
      text: `Тапайте по своим клеткам: +1 боец за тап. Осталось ${game.pool} ${plural(game.pool, "очко", "очка", "очков")}. Или «Авто».`,
    };
  } else if (effMode === "upgrade") {
    if (selected === null) coach = {
      tone: "info", title: `Улучшения · ${game.pool}`,
      text: "Тапните свою клетку, затем выберите постройку. Всё, что построено, остаётся на клетке даже после её захвата.",
    };
    else if (cellUp) coach = {
      tone: "info", title: cellUp.name,
      text: `Здесь уже стоит ${cellUp.name.toLowerCase()}: ${cellUp.desc} Одна клетка — одно улучшение. Выберите другую.`,
    };
    else coach = {
      tone: "info", title: "Что построить?",
      text: `Очков: ${game.pool}. Выберите постройку ниже. ${UPGRADES.wall.name} ${UPGRADES.wall.cost}, ${UPGRADES.camp.name.toLowerCase()} ${UPGRADES.camp.cost}, ${UPGRADES.forge.name.toLowerCase()} ${UPGRADES.forge.cost}.`,
    };
  } else if (selected !== null && src) {
    coach = {
      tone: "info", title: `Атака · ${k} ${plural(k, "боец", "бойца", "бойцов")}`,
      text: "Тапните соседнюю клетку со значком: ✓ победа, 50% монета, ✗ провал, ⚠ мины. Укрепления цели уже учтены.",
    };
  } else if (anyReady) {
    coach = {
      tone: finalRound ? "warn" : "info", title: finalRound ? "Финальный ход" : "В атаку",
      text: finalRound
        ? T.guideFinal
        : "Тапните свою пульсирующую клетку с числом 2+, затем соседнюю цель. Закончили — «Конец хода».",
    };
  } else {
    coach = { tone: "warn", title: "Ходов не осталось", text: "Нет клеток, способных атаковать. Завершите ход: очки и бойцы сохранятся." };
  }

  const phaseLabel = !playing ? "Конец" : game.phase === "player" ? "Ваш ход" : T.foeTurn;
  const pctYou = pc + ec ? (pc / (pc + ec)) * 100 : 50;
  const fx = game.battle;
  const center = (i: number) => ({ x: (((i % cols) + 0.5) / cols) * 100, y: ((Math.floor(i / cols) + 0.5) / rows) * 100 });
  const gridStyle = { gridTemplateColumns: `repeat(${cols}, 1fr)` };
  const coordChip = selected !== null && myTurn && effMode !== "reinforce" ? coordinates(selected, cols) : null;

  return (
    <div className={`app theme-${theme} biome-${game.biome}`} ref={appRef}>
      <div className="vignette" />

      <header className="topbar">
        <div className="brand">
          <span className="brand-mark"><Sigil side="player" /></span>
          <span className="brand-text"><span className="brand-name">ЭХО</span><span className="brand-tag">{T.brandTag}</span></span>
        </div>
        <div className="top-actions">
          <button className="pill" onClick={() => setGuide(true)}><Help size={17} /> <span>Правила</span></button>
          <button className="icon-btn" onClick={() => { setMenuTheme(theme); setMenu(true); }} aria-label={T.menuTitle} title={T.menuTitle}><Restart size={18} /></button>
        </div>
      </header>

      <main className="layout">
        <section className="col-board">
          <div className="score">
            <div className="score-side you">
              <span className="score-ico"><Sigil side="player" /></span>
              <div><b>{pc}</b><small>{plural(pc, "клетка", "клетки", "клеток")} · {pu}</small></div>
            </div>
            <div className="score-mid">
              <span className="round">{finalRound ? T.roundFinal : T.round} {game.round}<i>/{ROUND_LIMIT}</i></span>
              <span className={`turn-pill ${game.phase} ${playing ? "" : "off"}`}>{phaseLabel}</span>
              <span className="pool-chip" aria-label={`Очков ${pts}: ${game.pool}`}><Bolt size={12} /> {game.pool} <small>очк.</small></span>
            </div>
            <div className="score-side foe">
              <div><b>{ec}</b><small>{plural(ec, "клетка", "клетки", "клеток")} · {eu}</small></div>
              <span className="score-ico"><Sigil side="enemy" /></span>
            </div>
            <div className="score-bar"><i style={{ width: `${pctYou}%` }} /></div>
          </div>

          <div className="map-title"><span>{game.mapName}</span><i /><span>{cols}×{rows} · №{game.mapNo}</span></div>

          <div className="board-card">
            <i className="corner c1" /><i className="corner c2" /><i className="corner c3" /><i className="corner c4" />
            <div className="board-wrap">
              <div className="axis-top" style={gridStyle}>{"ABCDEFG".slice(0, cols).split("").map(l => <span key={l}>{l}</span>)}</div>
              <div className="axis-left" style={{ gridTemplateRows: `repeat(${rows}, 1fr)` }}>{Array.from({ length: rows }, (_, i) => <span key={i}>{i + 1}</span>)}</div>
              <div className="grid-wrap">
                <div className="grid" style={gridStyle}>
                  {cells.map((tile, i) => {
                    if (tile.kind === "rock") {
                      return <div key={i} className="cell k-rock o-none" aria-hidden="true"><TileFace owner={null} units={0} kind="rock" /></div>;
                    }
                    const isTarget = myTurn && effMode === "attack" && selected !== null && targets.includes(i);
                    const fc: Forecast | null = isTarget && !(tile.owner === "player" && tile.units >= MAX_UNITS)
                      ? forecast(cells, i, k, "player") : null;
                    const ready = myTurn && effMode === "attack" && selected === null && canAct(tile, "player");
                    const plus = myTurn && effMode === "reinforce" && tile.owner === "player" && tile.units < MAX_UNITS;
                    const upmark = myTurn && effMode === "upgrade" && canUpgrade(tile, "player");
                    const spent = myTurn && effMode === "attack" && tile.owner === "player" && tile.used;
                    const home = i === game.homes.player || i === game.homes.enemy;
                    const cls = [
                      "cell", `o-${tile.owner ?? "none"}`, `k-${tile.kind}`,
                      selected === i && "sel", ready && "ready", (plus || upmark) && "can-plus", spent && "spent", partner === i && "partner",
                      fc && `fc-${fc}`, game.recent.includes(i) && "recent", game.flash.includes(i) && "flash",
                    ].filter(Boolean).join(" ");
                    const kindName = tile.kind === "plain" ? "" : `, ${T.kinds[tile.kind]}${tile.kind === "fort" ? " +1" : ""}`;
                    const label = `${coordinates(i, cols)}: ${tile.owner === "player" ? "ваша" : tile.owner === "enemy" ? T.foeGen : "нейтральная"}${tile.units ? `, ${tile.units} бойцов` : ""}${kindName}${tile.up ? `, ${UPGRADES[tile.up].name.toLowerCase()}` : ""}${tile.link >= 0 ? `, ведут в ${coordinates(tile.link, cols)}` : ""}`;
                    return (
                      <button key={i} type="button" className={cls} aria-label={label} aria-pressed={selected === i} onClick={() => onTile(i)}>
                        <TileFace owner={tile.owner} units={tile.units} kind={tile.kind} up={tile.up} home={home} plus={plus} upmark={upmark} spent={spent} badge={fc}
                          portalTo={tile.link >= 0 ? coordinates(tile.link, cols) : undefined} />
                      </button>
                    );
                  })}
                </div>
                {fx && fx.from !== fx.to && (
                  <svg className="fx" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    <line key={`l${fx.id}-${game.nextId}`} className={`fx-line ${fx.by}`} x1={center(fx.from).x} y1={center(fx.from).y} x2={center(fx.to).x} y2={center(fx.to).y} vectorEffect="non-scaling-stroke" pathLength={1} />
                  </svg>
                )}
              </div>
            </div>
          </div>

          <div className="legend">
            <span className="lg teal"><Crystal size={15} /> {T.kindsCap.source} +1</span>
            <span className="lg steel"><Tower size={15} /> {T.kindsCap.fort} +1 навсегда</span>
            <span className="lg violet"><Gate size={15} /> {T.kindsCap.portal} ⇄ связаны</span>
            <span className="lg amber"><MineIcon size={15} /> {T.kindsCap.mine}: {T.kinds.relic} +{RELIC_BONUS}</span>
            <span className="lg grey"><Crag size={15} /> {T.kindsCap.rock}</span>
          </div>
        </section>

        <aside className="col-side">
          <div className="card pool-card">
            <div className="pool-head">
              <span className="lbl"><Bolt size={13} /> Очки {pts}</span>
              <span className="pool-num">{game.pool}</span>
            </div>
            <div className="pips" aria-hidden="true">
              {Array.from({ length: 16 }, (_, i) => <span key={i} className={`pip ${i < game.pool ? "full" : ""}`} />)}
            </div>
            <p className="pool-note">
              {T.id === "front" ? "Каждые сутки" : "Каждый раунд"}: <b>+{gain}</b> <span className="dim">({pc} {plural(pc, "клетка", "клетки", "клеток")}{sources ? ` + ${sources} ${T.kinds.source.slice(0, 5)}.` : ""}{relics ? ` + ${relics * RELIC_BONUS} ${T.kinds.relic.slice(0, 5)}.` : ""}{forges ? ` + ${forges} ${T.upgrades.forge.name.toLowerCase().slice(0, 5)}.` : ""})</span>
            </p>
          </div>

          <div ref={dockRef} className={`card dock tone-${coach.tone} ${dockOpen ? "open" : "collapsed"}`}>
            <button className="dock-handle" onClick={toggleDock} aria-expanded={dockOpen} aria-label={dockOpen ? "Скрыть панель" : "Показать панель"}>
              <span className="grip" />
              <span className="dock-handle-text">{dockOpen ? "Скрыть" : "Показать панель"}</span>
              <Chevron size={14} className={dockOpen ? "" : "flip"} />
            </button>

            <div className="dock-top">
              <div className="coach-head">
                <span className="coach-ico">{coach.tone === "enemy" ? <i className="spin" /> : coach.tone === "warn" ? "!" : <Sigil side="player" />}</span>
                <h3>{coach.title}</h3>
                {coordChip && <span className="coord">{coordChip}</span>}
              </div>
              <button className="btn end mini-end" disabled={!myTurn} onClick={finishTurn}>Конец <Arrow size={16} /></button>
            </div>

            <div className="dock-body">
              <p className="coach-text">{coach.text}</p>

              <div className="tools">
                {myTurn && selected !== null && src && effMode === "attack" && (
                  <div className="stepper">
                    <span className="lbl">В бой</span>
                    <div className="step-ctl">
                      <button onClick={() => setSend(Math.max(1, k - 1))} disabled={k <= 1} aria-label="Меньше"><Minus size={18} /></button>
                      <b>{k}</b>
                      <button onClick={() => setSend(Math.min(src.units - 1, k + 1))} disabled={k >= src.units - 1} aria-label="Больше"><Plus size={18} /></button>
                    </div>
                    <button className="mini-btn" onClick={() => setSend(src.units - 1)} disabled={k === src.units - 1}>Все</button>
                  </div>
                )}
                {myTurn && effMode === "reinforce" && (
                  <div className="stepper">
                    <button className="mini-btn wide" onClick={auto} disabled={!canAdd || game.pool < 1}><Bolt size={13} /> Авто</button>
                    <button className="mini-btn wide" onClick={() => setGame(undoLast(game))} disabled={!game.undo.length}><Undo size={15} /> Отмена</button>
                  </div>
                )}
                {myTurn && effMode === "upgrade" && (
                  <div className="upgrades">
                    {UPGRADE_LIST.map(u => {
                      const def = UPGRADES[u];
                      const ok = selected !== null && !!src && canUpgrade(src, "player") && game.pool >= def.cost;
                      return (
                        <button key={u} className={`upg ${u}`} disabled={!ok} onClick={() => doUpgrade(u)} aria-label={`${def.name}: ${def.short}, ${def.cost} очков`}>
                          <span className="ic"><UpgradeGlyph up={u} /></span>
                          <b>{def.name}</b>
                          <small>{def.short}</small>
                          <em>{def.cost}</em>
                        </button>
                      );
                    })}
                  </div>
                )}
                {myTurn && effMode === "upgrade" && game.undo.length > 0 && (
                  <button className="mini-btn undo-side" onClick={() => setGame(undoLast(game))} aria-label="Отменить"><Undo size={16} /></button>
                )}
              </div>

              <div className="btn-row">
                <div className="seg" role="tablist" aria-label="Режим">
                  <button role="tab" aria-selected={effMode === "reinforce"} className={effMode === "reinforce" ? "on" : ""} disabled={!myTurn || game.pool < 1} onClick={() => changeMode("reinforce")}>
                    <Plus size={15} /> <span>Усилить</span>{game.pool > 0 && <em>{game.pool}</em>}
                  </button>
                  <button role="tab" aria-selected={effMode === "attack"} className={effMode === "attack" ? "on" : ""} disabled={!myTurn} onClick={() => changeMode("attack")}>
                    <Sword size={15} /> <span>Атака</span>
                  </button>
                  <button role="tab" aria-selected={effMode === "upgrade"} className={effMode === "upgrade" ? "on" : ""} disabled={!myTurn || game.pool < UPGRADE_MIN} onClick={() => changeMode("upgrade")}>
                    <Chevrons size={15} /> <span>Улучшить</span>
                  </button>
                </div>
                <button className={`btn end ${myTurn && effMode === "attack" && !anyReady ? "hot" : ""}`} disabled={!myTurn} onClick={finishTurn}>
                  <span className="end-full">{finalRound ? (T.id === "front" ? "Завершить операцию" : "Завершить битву") : "Конец хода"}</span><span className="end-short">{finalRound ? "Финиш" : "Конец"}</span> <Arrow size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="card log-card">
            <div className="card-head"><span className="lbl">{T.id === "front" ? "Сводка" : "Хроника"}</span></div>
            <ul>
              {game.logs.slice(0, 6).map((l, i) => (
                <li key={l.id} className={`${l.who} ${i === 0 ? "latest" : ""}`}><i />{l.text}</li>
              ))}
            </ul>
          </div>
        </aside>
      </main>

      {guide && <Tutorial onClose={closeGuide} />}

      {pending?.type === "coin" && !guide && (
        <CoinToss key={pending.id} p={pending} onDone={() => setGame(g => resolveCoin(g))} />
      )}
      {pending?.type === "mine" && pending.side === "player" && !guide && (
        <Minesweeper key={pending.id} place={coordinates(pending.to, cols)} units={pending.k} onFinish={ok => setGame(g => resolveMine(g, ok))} />
      )}

      {menu && !guide && (() => {
        const M = THEMES[menuTheme];
        return (
          <div className="backdrop" onMouseDown={() => setMenu(false)}>
            <div className="modal menu" role="dialog" aria-modal="true" aria-label={M.menuTitle} onMouseDown={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setMenu(false)} aria-label="Закрыть">×</button>
              <span className="kicker">{M.menuTitle}</span>
              <h2>Выберите <em>сеттинг</em></h2>
              <div className="themes" role="radiogroup" aria-label="Сеттинг">
                {(Object.keys(THEMES) as ThemeId[]).map(id => (
                  <button key={id} role="radio" aria-checked={menuTheme === id} className={`theme-card t-${id} ${menuTheme === id ? "on" : ""}`} onClick={() => setMenuTheme(id)}>
                    <span className="swatch"><i /><i /><i /></span>
                    <b>{THEMES[id].label}</b>
                    <small>{THEMES[id].blurb}</small>
                  </button>
                ))}
              </div>
              <h2 className="h2-sub">Выберите <em>противника</em></h2>
              <div className="levels">
                <button className={level === "calm" ? "on" : ""} onClick={() => setLevel("calm")}>
                  <b>{M.levels.calm[0]}</b><small>{M.levels.calm[1]}</small>
                </button>
                <button className={level === "hard" ? "on" : ""} onClick={() => setLevel("hard")}>
                  <b>{M.levels.hard[0]}</b><small>{M.levels.hard[1]}</small>
                </button>
              </div>
              <p className="menu-note">Карта создаётся заново: размер, рельеф, {M.kinds.portal}, минные поля и позиции баз. Она всегда симметрична.</p>
              <button className="btn primary big" onClick={() => startNew(level, menuTheme)}>{menuTheme === "front" ? "Начать операцию" : "Начать битву"} <Arrow size={17} /></button>
            </div>
          </div>
        );
      })()}

      {!playing && !guide && !menu && !pending && (
        <div className="backdrop">
          <div className={`modal end ${game.status}`} role="dialog" aria-modal="true">
            <div className="end-sym">{game.status === "won" ? <Sigil side="player" size={72} /> : game.status === "lost" ? (T.id === "front" ? <Sigil side="enemy" size={72} /> : <Eclipse size={72} />) : <span>=</span>}</div>
            <span className="kicker">{(game.status === "won" ? T.won : game.status === "lost" ? T.lost : T.draw)[0]}</span>
            <h2>{(game.status === "won" ? T.won : game.status === "lost" ? T.lost : T.draw)[1]} <em>{(game.status === "won" ? T.won : game.status === "lost" ? T.lost : T.draw)[2]}</em></h2>
            <p>{game.reason}</p>
            <div className="end-stats">
              <div><b>{game.round}</b><span>{T.id === "front" ? "сутки" : "раунд"}</span></div>
              <div><b className="c-blue">{pc}</b><span>ваших клеток</span></div>
              <div><b className="c-crim">{ec}</b><span>клеток {T.foeGen}</span></div>
              <div><b>{pu}</b><span>ваших бойцов</span></div>
            </div>
            <button className="btn primary big" onClick={() => startNew(level, theme)}>{T.menuTitle} <Arrow size={17} /></button>
            <button className="btn ghost" onClick={() => { setMenuTheme(theme); setMenu(true); }}>Сменить сеттинг или противника</button>
          </div>
        </div>
      )}
    </div>
  );
}
