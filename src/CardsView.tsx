import { CARD_GROUPS, type T } from './content';
import cardData from './data/cards.json';
import { iconUrl, useT } from './ui';

interface CardGroup { id: string; back: string; cards: { name: T; qty: number }[] }

const GROUPS = cardData as unknown as CardGroup[];
const byId = (id: string) => GROUPS.find((g) => g.id === id);
const copies = (g: CardGroup) => g.cards.reduce((sum, c) => sum + c.qty, 0);

/** A group is in play when its expansion is. */
function inPlay(id: string, kaycee: boolean, pelts: boolean) {
  if (id.startsWith('kaycee:')) return kaycee;
  if (id.startsWith('pelts:')) return pelts;
  return true;
}

function Back({ back, count }: { back: string; count: number }) {
  const shown = Math.min(3, Math.ceil(count / 4));
  return (
    <span className="back-fan" aria-hidden="true">
      {Array.from({ length: shown }, (_, i) => (
        <img key={i} src={iconUrl(`backs/${back}`)} alt="" style={{ transform: `translateX(${(i - (shown - 1)) * 5}px) rotate(${(i - (shown - 1)) * 5}deg)` }} />
      ))}
    </span>
  );
}

function GroupRow({ id, i, byName }: { id: string; i: number; byName?: boolean }) {
  const t = useT();
  const g = byId(id);
  const meta = CARD_GROUPS.find((m) => m.id === id);
  if (!g || !meta) return null;
  const n = copies(g);
  return (
    <details className="card-group" style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}>
      <summary>
        <Back back={g.back} count={n} />
        <span className="group-text">
          <b>{t(meta.title)}</b>
          <small>{t(meta.where)}</small>
          {byName && <em>{t(['Pull out by name', 'Sacar por su nombre'])}</em>}
        </span>
        <span className="group-count">{n}</span>
      </summary>
      <ul className="card-names">
        {g.cards.map((c) => <li key={c.name[0] + c.name[1]}>{t(c.name)}{c.qty > 1 && <i> ×{c.qty}</i>}</li>)}
      </ul>
    </details>
  );
}

/** Which printed cards this game uses and which stay in the box, by their backs. */
export function CardsView({ kaycee, pelts }: { kaycee: boolean; pelts: boolean }) {
  const t = useT();
  const known = CARD_GROUPS.filter((m) => byId(m.id));
  const used = known.filter((m) => inPlay(m.id, kaycee, pelts));
  const out = known.filter((m) => !inPlay(m.id, kaycee, pelts));
  const total = (list: typeof known) => list.reduce((sum, m) => sum + copies(byId(m.id)!), 0);
  const sharedBack = out.filter((m) => m.sharedBack);
  return (
    <>
      <h1>{t(['Your cards', 'Vuestras cartas'])}</h1>
      <p className="lead">{t(['Sort by the backs. Tap a group for its names.', 'Separadlas por el dorso. Toca un grupo para ver los nombres.'])}</p>
      <h2>{t([`Use these: ${total(used)} cards`, `Usad estas: ${total(used)} cartas`])}</h2>
      <div className="card-groups">{used.map((m, i) => <GroupRow key={m.id} id={m.id} i={i} />)}</div>
      <h2>{t([`Leave in the box: ${total(out)} cards`, `Dejad en la caja: ${total(out)} cartas`])}</h2>
      {out.length === 0
        ? <p className="muted">{t(['Nothing: you’re playing with everything.', 'Nada: jugáis con todo.'])}</p>
        : (
          <>
            {sharedBack.length > 0 && (
              <p className="warning">{t(['Careful: some of these share a back with cards you’re using, so pull them out by name. They’re marked below.', 'Ojo: algunas comparten dorso con cartas que sí usáis, así que sacadlas por su nombre. Están marcadas abajo.'])}</p>
            )}
            <div className="card-groups out">{out.map((m, i) => <GroupRow key={m.id} id={m.id} i={i + used.length} byName={m.sharedBack} />)}</div>
          </>
        )}
    </>
  );
}
