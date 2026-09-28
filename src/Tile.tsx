import { CampIcon, Chevrons, Crag, Crown, Crystal, ForgeIcon, Gate, MineIcon, Relic, Sigil, Tower, WallIcon } from "./icons";
import type { Forecast, Kind, Owner, Upgrade } from "./game";

export const badgeText: Record<Forecast, string> = { win: "✓", tie: "50%", lose: "✗", move: "→", mine: "⚠" };

export function UpgradeGlyph({ up }: { up: Upgrade }) {
  return up === "wall" ? <WallIcon /> : up === "forge" ? <ForgeIcon /> : <CampIcon />;
}

export type FaceProps = {
  owner: Owner;
  units: number;
  kind: Kind;
  up?: Upgrade | null;
  home?: boolean;
  plus?: boolean;
  upmark?: boolean;
  spent?: boolean;
  badge?: Forecast | null;
  /** Координата парных врат: подписывается на клетке портала. */
  portalTo?: string;
};

/** Внутренности клетки. Используется и на поле, и в обучении. */
export function TileFace({ owner, units, kind, up, home, plus, upmark, spent, badge, portalTo }: FaceProps) {
  return (
    <>
      <span className="plate" />
      {owner && <span className="sigil"><Sigil side={owner} /></span>}
      {kind === "rock" && <span className="big-icon rock"><Crag /></span>}
      {kind === "portal" && <span className="big-icon portal"><Gate /></span>}
      {kind === "mine" && <span className="big-icon mine"><MineIcon /><i>!</i></span>}
      {(kind === "source" || kind === "fort" || kind === "relic") && (
        <span className={`terr ${kind}`}>
          {kind === "source" ? <Crystal /> : kind === "fort" ? <Tower /> : <Relic />}
          {kind === "fort" && <b>+1</b>}
        </span>
      )}
      {units > 0 && <span className="num">{units}</span>}
      {up && <span className={`upb ${up}`}><UpgradeGlyph up={up} /></span>}
      {portalTo && <span className="plabel">⇄ {portalTo}</span>}
      {home && <span className="home"><Crown /></span>}
      {plus && <span className="plus">+</span>}
      {upmark && <span className="plus upm"><Chevrons size="100%" /></span>}
      {spent && <span className="done">✓</span>}
      {badge && <span className={`badge ${badge}`}>{badgeText[badge]}</span>}
    </>
  );
}
