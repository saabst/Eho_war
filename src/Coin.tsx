import { useEffect, useRef, useState } from "react";
import { Sigil } from "./icons";
import { T } from "./theme";
import type { Pending } from "./game";

export function CoinFace({ side }: { side: "player" | "enemy" }) {
  return (
    <div className={`face ${side}`}>
      <span className="face-ring" />
      <span className="face-sigil"><Sigil side={side} /></span>
    </div>
  );
}

/** Статичная монета для обучения. */
export function StaticCoin({ side }: { side: "player" | "enemy" }) {
  return <div className="coin-static"><CoinFace side={side} /></div>;
}

type CoinPending = Extract<Pending, { type: "coin" }>;

/** Полноэкранный бросок монеты. Итог заранее определён в игре, анимация садится на нужную сторону. */
export default function CoinToss({ p, onDone }: { p: CoinPending; onDone: () => void }) {
  const [landed, setLanded] = useState(false);
  const done = useRef(onDone);
  done.current = onDone;
  const winner = p.win ? p.side : p.side === "player" ? "enemy" : "player";
  const good = winner === "player";

  useEffect(() => {
    const t1 = window.setTimeout(() => {
      setLanded(true);
      try { navigator.vibrate?.(good ? [25, 40, 25] : 60); } catch { /* ignore */ }
    }, 1800);
    const t2 = window.setTimeout(() => done.current(), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [good]);

  const attacker = p.side === "player" ? T.coinYou : T.coinFoe;
  return (
    <div className="toss" role="dialog" aria-modal="true" aria-label="Бросок монеты" onClick={() => landed && done.current()}>
      <div className="toss-inner">
        <span className="kicker">{T.coinKick}</span>
        <div className="toss-vs">
          <b className={p.side === "player" ? "c-blue" : "c-crim"}>{p.k}</b>
          <i>против</i>
          <b className={p.side === "player" ? "c-crim" : "c-blue"}>{p.d}</b>
        </div>
        <p className="toss-sub">{attacker}. Решает монета.</p>

        <div className="coin-stage">
          <div className="coin-lift">
            <div className="coin3d" style={{ ["--end" as string]: winner === "player" ? "1800deg" : "1980deg" }}>
              {[-4, -2, 0, 2, 4].map(z => <span key={z} className="slice" style={{ transform: `translateZ(${z}px)` }} />)}
              <div className="side front"><CoinFace side="player" /></div>
              <div className="side back"><CoinFace side="enemy" /></div>
            </div>
          </div>
          <span className="coin-shadow" />
          {landed && <span className={`land-ring ${good ? "good" : "bad"}`} />}
        </div>

        <div className={`toss-result ${landed ? "on" : ""} ${good ? "good" : "bad"}`}>
          {landed ? (good ? T.coinGood : T.coinBad) : "\u00A0"}
        </div>
      </div>
    </div>
  );
}
