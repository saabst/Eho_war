import { useRef, useState } from "react";
import { Arrow, Flag, MineIcon } from "./icons";
import { RELIC_BONUS } from "./game";
import { T } from "./theme";

type M = { mine: boolean; open: boolean; flag: boolean; n: number };
const W = 4;
const MINES = 3;
const TOTAL = W * W;

const around = (i: number) => {
  const r = Math.floor(i / W);
  const c = i % W;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    const rr = r + dr, cc = c + dc;
    if (rr >= 0 && rr < W && cc >= 0 && cc < W) out.push(rr * W + cc);
  }
  return out;
};

const empty = (): M[] => Array.from({ length: TOTAL }, () => ({ mine: false, open: false, flag: false, n: 0 }));

/** Мины ставятся после первого нажатия: первая плита и её соседи безопасны, поэтому всегда открывается «поляна». */
function place(first: number): M[] {
  const b = empty();
  const ban = new Set([first, ...around(first)]);
  const free = Array.from({ length: TOTAL }, (_, i) => i).filter(i => !ban.has(i));
  for (let n = 0; n < MINES; n++) {
    const k = Math.floor(Math.random() * free.length);
    b[free.splice(k, 1)[0]].mine = true;
  }
  b.forEach((c, i) => { c.n = around(i).filter(j => b[j].mine).length; });
  return b;
}

function flood(b: M[], start: number) {
  const stack = [start];
  while (stack.length) {
    const i = stack.pop()!;
    const c = b[i];
    if (c.open || c.flag || c.mine) continue;
    c.open = true;
    if (c.n === 0) around(i).forEach(j => stack.push(j));
  }
}

const buzz = (p: number | number[]) => { try { navigator.vibrate?.(p); } catch { /* ignore */ } };

export default function Minesweeper({ place: where, units, onFinish }: { place: string; units: number; onFinish: (ok: boolean) => void }) {
  const [board, setBoard] = useState<M[]>(empty);
  const [started, setStarted] = useState(false);
  const [state, setState] = useState<"play" | "won" | "lost">("play");
  const [boom, setBoom] = useState(-1);
  const [flagMode, setFlagMode] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const long = useRef(false);

  const flags = board.filter(c => c.flag).length;

  function toggleFlag(i: number) {
    if (state !== "play" || !started || board[i].open) return;
    const b = board.map(c => ({ ...c }));
    b[i].flag = !b[i].flag;
    setBoard(b);
    buzz(12);
  }

  function open(i: number) {
    if (state !== "play") return;
    if (!started) {
      const b = place(i);
      flood(b, i);
      setBoard(b);
      setStarted(true);
      buzz(10);
      return;
    }
    const c = board[i];
    if (c.flag || c.open) return;
    const b = board.map(x => ({ ...x }));
    if (b[i].mine) {
      b.forEach(x => { if (x.mine) x.open = true; });
      setBoard(b);
      setBoom(i);
      setState("lost");
      buzz([80, 40, 160]);
      return;
    }
    flood(b, i);
    setBoard(b);
    if (b.filter(x => x.open && !x.mine).length === TOTAL - MINES) {
      setState("won");
      buzz([20, 40, 20, 40, 60]);
    } else buzz(8);
  }

  const tap = (i: number) => (flagMode && started ? toggleFlag(i) : open(i));

  const down = (i: number) => {
    long.current = false;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { long.current = true; toggleFlag(i); }, 380);
  };
  const up = (i: number) => {
    window.clearTimeout(timer.current);
    if (!long.current) tap(i);
    long.current = false;
  };
  const cancel = () => { window.clearTimeout(timer.current); long.current = true; };

  return (
    <div className="backdrop mine-back">
      <div className={`modal mines ${state}`} role="dialog" aria-modal="true" aria-label="Разминирование">
        <span className="kicker">{T.mineTitle}</span>
        <h2>{T.kindsCap.relic} <em>{where}</em></h2>

        <div className="mine-info">
          <span><MineIcon size={16} /> Мин: <b>{Math.max(0, MINES - flags)}</b></span>
          <span>Отряд: <b>{units}</b></span>
        </div>

        <div className={`mine-grid ${state === "lost" ? "shake" : ""}`}>
          {board.map((c, i) => {
            const cls = ["mc", c.open && "open", c.open && !c.mine && c.n > 0 && `n${c.n}`, c.open && c.mine && "mine", boom === i && "boom", c.flag && "flag"].filter(Boolean).join(" ");
            return (
              <button
                key={i} type="button" className={cls}
                aria-label={c.open ? (c.mine ? "мина" : `рядом мин: ${c.n}`) : c.flag ? "флаг" : "закрыто"}
                onPointerDown={() => down(i)} onPointerUp={() => up(i)} onPointerLeave={cancel} onPointerCancel={cancel}
                onContextMenu={e => e.preventDefault()}
                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(i); } }}
              >
                {c.open && c.mine ? <MineIcon /> : c.open && c.n > 0 ? c.n : c.flag ? <Flag /> : null}
              </button>
            );
          })}
        </div>

        {state === "play" ? (
          <>
            <p className="mine-hint">
              {started
                ? "Цифра — сколько мин вокруг плиты. Откройте все безопасные плиты. Долгое нажатие ставит флаг."
                : "Нажмите на любую плиту: первое нажатие всегда безопасно."}
            </p>
            <div className="mine-tools">
              <button className={`tool ${!flagMode ? "on" : ""}`} onClick={() => setFlagMode(false)}>Открыть</button>
              <button className={`tool ${flagMode ? "on" : ""}`} onClick={() => setFlagMode(true)}><span className="ic"><Flag size={16} /></span> Флаг</button>
            </div>
          </>
        ) : (
          <div className={`mine-result ${state}`}>
            <b>{state === "won" ? T.mineWon : "Подрыв!"}</b>
            <p>{state === "won" ? `Точка захвачена. Она даёт +${RELIC_BONUS} очка ${T.id === "front" ? "подкрепления каждые сутки" : "усиления каждый раунд"}.` : `Отряд из ${units} потерян. Точка остаётся заминированной.`}</p>
            <button className="btn primary big" onClick={() => onFinish(state === "won")}>Продолжить <Arrow size={17} /></button>
          </div>
        )}
      </div>
    </div>
  );
}
