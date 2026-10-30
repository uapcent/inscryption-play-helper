import { useEffect, useRef, useState } from 'react';
import { CARD_GROUPS, type T } from './content';
import cardData from './data/cards.json';
import itemData from './data/items.json';
import { CARD_NOTES } from './notes';
import { SigilEntry, sigilByKey } from './Sigils';
import { TutorialPlayer } from './TutorialPlayer';
import { iconUrl, useT } from './ui';

export interface CardRow { id: string; name: T; qty: number; sigils?: string[] }
export interface CardGroup { id: string; back: string; cards: CardRow[] }
export const GROUPS = cardData as unknown as CardGroup[];
const ITEMS = itemData as unknown as Record<string, { icon?: string; text: T; note?: T }>;

const locate = (id: string) => {
  for (const g of GROUPS) {
    const card = g.cards.find((c) => c.id === id);
    if (card) return { group: g, card };
  }
  return null;
};

/** A card's page: what it is, its sigils, its notes, and its tutorial if it has one. */
export function CardSheet({ id, kaycee, onClose }: { id: string; kaycee: boolean; onClose: () => void }) {
  const t = useT();
  const ref = useRef<HTMLDialogElement>(null);
  const [showing, setShowing] = useState(false);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  useEffect(() => setShowing(false), [id]);
  // A tutorial takes over the page: its table, caption and buttons all fit on a phone.
  useEffect(() => {
    if (showing) ref.current?.scrollTo(0, 0);
  }, [showing]);
  const found = locate(id);
  if (!found) return null;
  const { group, card } = found;
  const meta = CARD_GROUPS.find((m) => m.id === group.id);
  const note = CARD_NOTES[id];
  const item = ITEMS[id];
  const sigils = (card.sigils ?? []).map(sigilByKey).filter((s) => s !== undefined);
  return (
    <dialog ref={ref} className="sheet" onClose={onClose} onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}>
      <div className="sheet-body">
        <button type="button" className="sheet-close" aria-label={t(['Close', 'Cerrar'])} onClick={() => ref.current?.close()}>×</button>
        <header className={`sheet-head${showing ? ' small' : ''}`}>
          <img src={iconUrl(`backs/${group.back}`)} alt="" />
          <div>
            <h2>{t(card.name)}</h2>
            <p className="note">{card.qty > 1 ? t([`${card.qty} copies`, `${card.qty} copias`]) : t(['1 copy', '1 copia'])}{meta ? ` · ${t(meta.title)}` : ''}</p>
            {!showing && meta && <p className="note muted">{t(meta.where)}</p>}
          </div>
        </header>
        {!showing && item && (
          <section className="card">
            <div className="item-effect">
              {item.icon && <img src={iconUrl(item.icon)} alt="" />}
              <div>
                <p>{t(item.text)}</p>
                {item.note && <p className="muted note">{t(item.note)}</p>}
              </div>
            </div>
          </section>
        )}
        {!showing && note?.notes?.map((n) => <p className="sheet-note" key={n[0]}>{t(n)}</p>)}
        {!showing && sigils.length > 0 && <ul className="sheet-sigils">{sigils.map((s) => <SigilEntry key={s!.key} s={s!} />)}</ul>}
        {note?.tutorial && !showing && <button type="button" className="primary wide" onClick={() => setShowing(true)}>{t(['See how it works', 'Ver cómo funciona'])}</button>}
        {note?.tutorial && showing && (
          <>
            <TutorialPlayer id={note.tutorial} kaycee={kaycee} />
            <button type="button" className="wide" onClick={() => setShowing(false)}>{t(['Back to the card', 'Volver a la carta'])}</button>
          </>
        )}
        {!item && !note?.notes && sigils.length === 0 && !note?.tutorial && <p className="muted">{t(['Nothing special: it just fights.', 'Nada especial: simplemente lucha.'])}</p>}
      </div>
    </dialog>
  );
}
