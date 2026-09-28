import { useEffect, useState, type ReactNode } from "react";
import { Arrow } from "./icons";
import { MAX_UNITS, RELIC_BONUS, ROUND_LIMIT, UPGRADES, type Forecast } from "./game";
import { TileFace, type FaceProps } from "./Tile";
import { StaticCoin } from "./Coin";
import { T } from "./theme";

type MiniProps = Partial<FaceProps> & { cls?: string };
function Mini({ owner = null, units = 0, kind = "plain", cls = "", ...rest }: MiniProps) {
  const own = owner ? `o-${owner}` : "o-none";
  return (
    <div className={`cell mini ${own} k-${kind} ${cls}`}>
      <TileFace owner={owner} units={units} kind={kind} {...rest} />
    </div>
  );
}

const Fight = ({ a, sent, d, fc, label }: { a: number; sent: number; d: number; fc: Forecast; label: string }) => (
  <div className="fight">
    <Mini owner="player" units={a} />
    <div className="fight-mid"><Arrow size={16} /><small>шлёте {sent}</small></div>
    <Mini owner="enemy" units={d} badge={fc} cls={`fc-${fc}`} />
    <span className={`fight-res ${fc}`}>{label}</span>
  </div>
);

type Slide = { kicker: string; title: ReactNode; visual: ReactNode; body: ReactNode };

const makeSlides = (): Slide[] => {
  const F = T.id === "front";
  const day = F ? "суток" : "раундов";
  return [
  {
    kicker: "I · Поле боя",
    title: <>Число — это <em>бойцы</em></>,
    visual: (
      <div className="mini-row">
        <Mini owner="player" units={2} />
        <Mini /><Mini units={1} /><Mini /><Mini />
        <Mini owner="enemy" units={2} />
      </div>
    ),
    body: (
      <>
        <p><b className="c-blue">{T.friendly[0].toUpperCase() + T.friendly.slice(1)} клетки</b> ваши, <b className="c-crim">{T.hostile}</b> — {T.foeGen}, серые — ничьи. Все начинают с одной клетки и <b>2 бойцов</b>.</p>
        <p>Ходят на соседнюю клетку: вверх, вниз, влево, вправо. Победа — захватить <b>все клетки врага</b>, а через {ROUND_LIMIT} {day} — иметь больше клеток.</p>
      </>
    ),
  },
  {
    kicker: "II · Усиление",
    title: <>Нажмите — <em>+1 боец</em></>,
    visual: (
      <div className="flow">
        <div className="flow-step"><Mini owner="player" units={2} plus /><small>Тап по своей клетке</small></div>
        <Arrow size={18} className="flow-arrow" />
        <div className="flow-step"><Mini owner="player" units={3} cls="flash" /><small>Получила +1</small></div>
      </div>
    ),
    body: (
      <>
        <p>{F ? "Каждые сутки" : "Каждый раунд"} вы получаете <b>столько очков, сколько у вас клеток</b>. Одно очко — один боец в любую вашу клетку. Просто тапайте по клеткам.</p>
        <p className="small">В клетке максимум {MAX_UNITS}. Очки можно копить. Кнопка «Авто» раздаст их сама.</p>
      </>
    ),
  },
  {
    kicker: "III · Атака",
    title: <>Больше — <em>победа</em></>,
    visual: (
      <div className="fights">
        <Fight a={4} sent={3} d={2} fc="win" label="Захват" />
        <Fight a={3} sent={2} d={2} fc="tie" label="Монета" />
        <Fight a={3} sent={2} d={4} fc="lose" label="Отбито" />
      </div>
    ),
    body: (
      <>
        <p>Тапните свою клетку с <b>2+ бойцами</b>, затем соседнюю цель. В бой идут все, кроме одного, — сколько именно, меняют кнопки <b>− +</b>.</p>
        <p className="small">Клетка ходит раз {F ? "в сутки" : "за раунд"}. Значок на цели заранее показывает исход.</p>
      </>
    ),
  },
  {
    kicker: "IV · Монета",
    title: <>Поровну — <em>решает монета</em></>,
    visual: (
      <div className="coins">
        <div><StaticCoin side="player" /><small>{F ? "Выпала ваша сторона: захват" : "Выпал свет: захват"}</small></div>
        <div><StaticCoin side="enemy" /><small>{F ? "Выпала чужая сторона: отбито" : "Выпала тьма: отбито"}</small></div>
      </div>
    ),
    body: (
      <>
        <p>Когда силы атакующего и защитника равны, в воздух взлетает монета. Шанс ровно <b>50 на 50</b>.</p>
        <p className="small">Победа по монете оставляет в клетке одного бойца.</p>
      </>
    ),
  },
  {
    kicker: "V · Минные поля",
    title: <>Захват через <em>разминирование</em></>,
    visual: (
      <div className="flow">
        <div className="flow-step"><Mini kind="mine" badge="mine" /><small>Заминирована</small></div>
        <Arrow size={18} className="flow-arrow" />
        <div className="mini-mines" aria-hidden="true">
          {["1", "", "", "2", "", "", "", "", "1", "", "", ""].slice(0, 9).map((v, i) => <span key={i} className={v ? `open n${v}` : i === 1 ? "open" : ""}>{v}</span>)}
        </div>
        <Arrow size={18} className="flow-arrow" />
        <div className="flow-step"><Mini owner="player" units={2} kind="relic" /><small>{T.mineWon}</small></div>
      </div>
    ),
    body: (
      <>
        <p>Жёлто-чёрные клетки заминированы ({T.kinds.mine}). Атакуйте их, и откроется мини-игра <b>«Сапёр»</b> 4×4: откройте все безопасные плиты, не задев мину.</p>
        <p>Цифра — число мин вокруг плиты. Долгое нажатие ставит флаг. Успех даёт <b className="c-gold">{T.kinds.relic === "высота" ? "высоту" : "реликвию"}: +{RELIC_BONUS} очка</b> {F ? "в сутки" : "в раунд"}. Подрыв — отряд потерян.</p>
      </>
    ),
  },
  {
    kicker: "VI · Улучшения",
    title: <>Стройте — <em>оно останется</em></>,
    visual: (
      <div className="feat-row three">
        <div><Mini owner="player" units={3} up="wall" /><small>{T.upgrades.wall.name}<br />{T.upgrades.wall.short}</small></div>
        <div><Mini owner="player" units={2} up="camp" /><small>{T.upgrades.camp.name}<br />{T.upgrades.camp.short}</small></div>
        <div><Mini owner="player" units={2} up="forge" /><small>{T.upgrades.forge.name}<br />{T.upgrades.forge.short}</small></div>
      </div>
    ),
    body: (
      <>
        <p>Режим <b className="c-gold">«Улучшить»</b>: тапните свою клетку и выберите постройку. Цена в очках: {UPGRADES.wall.name.toLowerCase()} — {UPGRADES.wall.cost}, {T.upgrades.camp.name.toLowerCase()} — {UPGRADES.camp.cost}, {T.upgrades.forge.name.toLowerCase()} — {UPGRADES.forge.cost}. На клетке — одно улучшение.</p>
        <p className="small">Всё, что построено на клетке, <b>остаётся при захвате</b>, как и {T.kinds.fort}. Захватив чужую постройку, вы забираете её пользу. {T.foe} тоже строит.</p>
      </>
    ),
  },
  {
    kicker: "VII · Карта",
    title: <>Каждая битва — <em>новая карта</em></>,
    visual: (
      <div className="feat-row">
        <div><Mini kind="source" /><small>{T.kindsCap.source}</small></div>
        <div><Mini kind="fort" units={1} /><small>{T.kindsCap.fort}</small></div>
        <div><Mini kind="portal" /><small>{T.kindsCap.portal}</small></div>
        <div><Mini kind="rock" /><small>{T.kindsCap.rock}</small></div>
      </div>
    ),
    body: (
      <div className="feat-list">
        <p><b className="c-teal">{T.kindsCap.source}</b> даёт +1 очко {F ? "в сутки" : "в раунд"}. <b className="c-steel">{T.kindsCap.fort}</b> добавляет защитнику +1 — навсегда, даже когда клетку захватят.</p>
        <p><b className="c-violet">{T.kindsCap.portal}</b> соединяют две дальние клетки: подпись «⇄» показывает, куда они ведут, а цвет — кто ими владеет. {T.kindsCap.rock} непроходим.</p>
        <p className="small">Размер, рельеф и стартовые позиции случайны, но карта всегда симметрична: у вас и {T.foeGen} равные шансы.</p>
      </div>
    ),
  },
  ];
};

export default function Tutorial({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const slides = makeSlides();
  const last = i === slides.length - 1;
  const slide = slides[i];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI(v => Math.min(slides.length - 1, v + 1));
      if (e.key === "ArrowLeft") setI(v => Math.max(0, v - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="modal guide" role="dialog" aria-modal="true" aria-label="Как играть" onMouseDown={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Закрыть">×</button>
        <div className="guide-dots">
          {slides.map((_, k) => (
            <button key={k} className={k === i ? "on" : k < i ? "done" : ""} onClick={() => setI(k)} aria-label={`Шаг ${k + 1}`} />
          ))}
        </div>
        <div className="guide-body" key={i}>
          <span className="kicker">{slide.kicker}</span>
          <h2>{slide.title}</h2>
          <div className="guide-visual">{slide.visual}</div>
          <div className="guide-text">{slide.body}</div>
        </div>
        <div className="guide-nav">
          <button className="btn ghost" onClick={() => setI(v => Math.max(0, v - 1))} disabled={i === 0}>Назад</button>
          <button className="btn primary" onClick={() => (last ? onClose() : setI(i + 1))}>
            {last ? (T.id === "front" ? "К операции" : "В бой") : "Дальше"} <Arrow size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
