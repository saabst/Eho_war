export type ThemeId = "gothic" | "front";

type Words = {
  id: ThemeId;
  label: string;
  blurb: string;
  brandTag: string;
  appTitle: string;
  /** Название противника: подлежащее, родительный падеж, ход противника. */
  foe: string;
  foeGen: string;
  foeTurn: string;
  /** Противник женского рода («Тьма захватила») или мужского («Противник захватил»). */
  fem: boolean;
  round: string;
  roundFinal: string;
  hostile: string;
  friendly: string;
  kinds: { source: string; fort: string; portal: string; mine: string; relic: string; rock: string };
  kindsCap: { source: string; fort: string; portal: string; mine: string; relic: string; rock: string };
  upgrades: {
    wall: { name: string; acc: string; short: string; desc: string };
    camp: { name: string; acc: string; short: string; desc: string };
    forge: { name: string; acc: string; short: string; desc: string };
  };
  pointsName: string;
  places: string[];
  won: [string, string, string];
  lost: [string, string, string];
  draw: [string, string, string];
  drawReason: string;
  start: string;
  finish: string;
  coinYou: string;
  coinFoe: string;
  coinKick: string;
  coinGood: string;
  coinBad: string;
  mineTitle: string;
  mineWon: string;
  menuTitle: string;
  levels: { calm: [string, string]; hard: [string, string] };
  guideFinal: string;
};

const gothic: Words = {
  id: "gothic",
  label: "Свет и тьма",
  blurb: "Тёмное фэнтези: бронза, золото, багрянец.",
  brandTag: "Война света и тьмы",
  appTitle: "ЭХО — Война света и тьмы",
  foe: "Тьма", foeGen: "тьмы", foeTurn: "Ход тьмы", fem: true,
  round: "Раунд", roundFinal: "Финал",
  hostile: "красные", friendly: "синие",
  kinds: { source: "кристалл", fort: "бастион", portal: "врата", mine: "мины", relic: "реликвия", rock: "скала" },
  kindsCap: { source: "Кристалл", fort: "Бастион", portal: "Врата", mine: "Мины", relic: "Реликвия", rock: "Скала" },
  upgrades: {
    wall: { name: "Стена", acc: "стену", short: "+1 защита", desc: "даёт клетке +1 к защите." },
    camp: { name: "Казарма", acc: "казарму", short: "+1 боец/раунд", desc: "каждый раунд добавляет бойца в эту клетку." },
    forge: { name: "Кузница", acc: "кузницу", short: "+1 очко/раунд", desc: "даёт +1 очко усиления каждый раунд." },
  },
  pointsName: "усиления",
  places: [
    "Пепельные равнины", "Забытые бастионы", "Ледяные пустоши", "Тихие руины", "Ржавые катакомбы",
    "Выжженные врата", "Багровые долины", "Проклятые руины", "Ледяные катакомбы", "Тихие долины",
  ],
  won: ["Победа", "Тишина", "ответила"], lost: ["Поражение", "Свет", "угас"], draw: ["Ничья", "Мир", "замер"],
  drawReason: "Раунды закончились. Свет и тьма равны во всём.",
  start: "Бой начинается. У вас одна клетка и 2 бойца.",
  finish: "Тьма повержена!",
  coinYou: "Ваша атака", coinFoe: "Атака тьмы", coinKick: "Силы равны",
  coinGood: "Удача за вами", coinBad: "Удача отвернулась",
  mineTitle: "Разминирование", mineWon: "Реликвия ваша",
  menuTitle: "Новая битва",
  levels: {
    calm: ["Спокойная тьма", "Осторожна, иногда ошибается и не рискует на монете. Для знакомства."],
    hard: ["Жёсткая тьма", "Считает ходы, строит кузницы и стены, охотится за реликвиями, идёт на 50/50, когда выгодно."],
  },
  guideFinal: "Это последний ход: после него битва закончится, тьма уже не ответит. Побеждает тот, у кого больше клеток.",
};

const front: Words = {
  id: "front",
  label: "Современный фронт",
  blurb: "Вымышленный конфликт: оливковый, сталь, ржавчина.",
  brandTag: "Линия фронта",
  appTitle: "ЭХО — Линия фронта",
  foe: "Противник", foeGen: "противника", foeTurn: "Ход противника", fem: false,
  round: "Сутки", roundFinal: "Финал",
  hostile: "рыжие", friendly: "зелёные",
  kinds: { source: "склад", fort: "укрепрайон", portal: "тоннель", mine: "минное поле", relic: "высота", rock: "завал" },
  kindsCap: { source: "Склад", fort: "Укрепрайон", portal: "Тоннель", mine: "Минное поле", relic: "Высота", rock: "Завал" },
  upgrades: {
    wall: { name: "Окопы", acc: "окопы", short: "+1 защита", desc: "дают клетке +1 к защите." },
    camp: { name: "Резерв", acc: "резерв", short: "+1 боец/сутки", desc: "каждые сутки добавляет бойца в эту клетку." },
    forge: { name: "Тыл", acc: "тыловую базу", short: "+1 очко/сутки", desc: "даёт +1 очко усиления каждые сутки." },
  },
  pointsName: "подкрепления",
  places: [
    "Степной рубеж", "Промзона", "Лесополоса", "Терриконовый район", "Заводской сектор",
    "Пригородный плацдарм", "Речной рубеж", "Рабочий посёлок", "Сектор «Север»", "Сектор «Юг»",
  ],
  won: ["Победа", "Рубеж", "взят"], lost: ["Поражение", "Рубеж", "потерян"], draw: ["Ничья", "Фронт", "замер"],
  drawReason: "Сутки закончились. Стороны равны во всём.",
  start: "Операция началась. У вас один опорный пункт и 2 бойца.",
  finish: "Противник разбит!",
  coinYou: "Ваша атака", coinFoe: "Атака противника", coinKick: "Силы равны",
  coinGood: "Жребий за вами", coinBad: "Жребий не в вашу пользу",
  mineTitle: "Разминирование", mineWon: "Высота ваша",
  menuTitle: "Новая операция",
  levels: {
    calm: ["Осторожный противник", "Действует аккуратно, иногда ошибается и не рискует на жребии. Для знакомства."],
    hard: ["Опытный противник", "Считает ходы, строит окопы и тыл, борется за высоты, идёт на 50/50, когда выгодно."],
  },
  guideFinal: "Это последний ход: после него операция закончится, противник уже не ответит. Побеждает тот, у кого больше клеток.",
};

export const THEMES: Record<ThemeId, Words> = { gothic, front };

/** Текущая тема. Меняется только при старте новой партии, поэтому мутабельная ссылка безопасна. */
export let T: Words = gothic;
export const setTheme = (id: ThemeId) => { T = THEMES[id]; };
/** Форма глагола под род противника. */
export const fv = (fem: string, masc: string) => (T.fem ? fem : masc);
