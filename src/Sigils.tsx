import { useState } from 'react';
import type { T } from './content';
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

/** Lower case without accents, so "aereo" finds "Aéreo". */
const plain = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const GROUP_TITLES: Record<Sigil['group'], T> = {
  base: ['Base game', 'Juego base'],
  kaycee: ['Kaycee’s Mod', 'Kaycee’s Mod'],
  pelts: ['Pelts', 'Pieles'],
};

export function SigilEntry({ s }: { s: Sigil }) {
  const t = useT();
  return (
    <li className="sigil">
      <Icon icon={s.icon} size={52} />
      <div>
        <b>{t(s.name)}</b>
        <span>{t(s.text)}</span>
        <em>{t(s.when)}{s.pile ? ` · ${t(s.pile)}` : ''}</em>
      </div>
    </li>
  );
}

/** Finds a sigil by its name in either language or by what it does. Only the expansions in play are listed. */
export function SigilsView({ kaycee, pelts }: { kaycee: boolean; pelts: boolean }) {
  const t = useT();
  const [q, setQ] = useState('');
  const query = plain(q.trim());
  const inPlay = (s: Sigil) => s.group === 'base' || (s.group === 'kaycee' && kaycee) || (s.group === 'pelts' && pelts);
  const matches = (s: Sigil) => !query || plain(`${s.name[0]} ${s.name[1]} ${t(s.text)}`).includes(query);
  const shown = SIGILS.filter((s) => inPlay(s) && matches(s));
  // Names first: someone typing a sigil's name wants that sigil on top.
  const score = (s: Sigil) => (query && plain(`${s.name[0]} ${s.name[1]}`).includes(query) ? 0 : 1);
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
          <ul>{sigils.map((s) => <SigilEntry key={s.key} s={s} />)}</ul>
        </section>
      ))}
      {!groups.length && <p className="muted">{t(['No sigil matches.', 'Ningún sello coincide.'])}</p>}
    </div>
  );
}
