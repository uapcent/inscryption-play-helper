import { useState } from 'react';
import type { T } from './content';
import cardData from './data/cards.json';
import sigilData from './data/sigils.json';
import { Icon, useT } from './ui';

export interface Sigil {
  key: string;
  icon: string;
  group: 'base' | 'kaycee' | 'pelts';
  name: T;
  text: T;
  when: T;
  pile?: T;
}

export const SIGILS = sigilData as unknown as Sigil[];
export const sigilByKey = (key: string) => SIGILS.find((s) => s.key === key);

interface CardRef { name: T; group: Sigil['group'] }

/** Every card that prints each sigil, once per name (some cards sit in several groups, like Raven). */
const CARDS_BY_SIGIL = new Map<string, CardRef[]>();
for (const g of cardData as unknown as { id: string; cards: { name: T; sigils?: string[] }[] }[]) {
  const group = g.id.split(':')[0] as Sigil['group'];
  for (const c of g.cards) for (const key of c.sigils ?? []) {
    const list = CARDS_BY_SIGIL.get(key) ?? [];
    if (!list.some((x) => x.name[0] === c.name[0])) list.push({ name: c.name, group });
    CARDS_BY_SIGIL.set(key, list);
  }
}

/** Lower case without accents, so "aereo" finds "Aéreo". */
const plain = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const GROUP_TITLES: Record<Sigil['group'], T> = {
  base: ['Base game', 'Juego base'],
  kaycee: ['Kaycee’s Mod', 'Kaycee’s Mod'],
  pelts: ['Pelts', 'Pieles'],
};

export function SigilEntry({ s, foundOn }: { s: Sigil; foundOn?: CardRef[] }) {
  const t = useT();
  return (
    <li className="sigil">
      <Icon icon={s.icon} size={52} />
      <div>
        <b>{t(s.name)}</b>
        <span>{t(s.text)}</span>
        <em>{t(s.when)}{s.pile ? ` · ${t(s.pile)}` : ''}</em>
        {foundOn && foundOn.length > 0 && (
          <small className="found-on">{t(['Found on', 'Aparece en'])} {foundOn.map((c) => t(c.name)).join(', ')}</small>
        )}
      </div>
    </li>
  );
}

/** Finds a sigil by its name in either language, by what it does or by the name of a card that has it. Only the expansions in play are listed. */
export function SigilsView({ kaycee, pelts }: { kaycee: boolean; pelts: boolean }) {
  const t = useT();
  const [q, setQ] = useState('');
  const query = plain(q.trim());
  const inPlay = (s: Sigil) => s.group === 'base' || (s.group === 'kaycee' && kaycee) || (s.group === 'pelts' && pelts);
  const inPlayGroup = (g: Sigil['group']) => g === 'base' || (g === 'kaycee' && kaycee) || (g === 'pelts' && pelts);
  const cardsWith = (s: Sigil) => (CARDS_BY_SIGIL.get(s.key) ?? []).filter((c) => inPlayGroup(c.group));
  const byName = (s: Sigil) => plain(`${s.name[0]} ${s.name[1]}`).includes(query);
  const byCard = (s: Sigil) => cardsWith(s).some((c) => plain(`${c.name[0]} ${c.name[1]}`).includes(query));
  const matches = (s: Sigil) => !query || byName(s) || byCard(s) || plain(t(s.text)).includes(query);
  const shown = SIGILS.filter((s) => inPlay(s) && matches(s));
  // Names first: someone typing a sigil's name wants that sigil on top, then the sigils of the card they typed.
  const score = (s: Sigil) => (!query ? 0 : byName(s) ? 0 : byCard(s) ? 1 : 2);
  const groups = (['base', 'kaycee', 'pelts'] as const)
    .map((group) => ({ group, sigils: shown.filter((s) => s.group === group).sort((a, b) => score(a) - score(b) || t(a.name).localeCompare(t(b.name))) }))
    .filter((g) => g.sigils.length);

  return (
    <div className="sigils">
      <input
        type="search"
        className="search"
        placeholder={t(['Search sigils', 'Buscar sellos'])}
        aria-label={t(['Search sigils', 'Buscar sellos'])}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {groups.map(({ group, sigils }) => (
        <section key={group}>
          <h2>{t(GROUP_TITLES[group])}</h2>
          <ul>{sigils.map((s) => <SigilEntry key={s.key} s={s} foundOn={query && byCard(s) ? cardsWith(s) : undefined} />)}</ul>
        </section>
      ))}
      {!groups.length && <p className="muted">{t(['No sigil matches.', 'Ningún sello coincide.'])}</p>}
    </div>
  );
}
