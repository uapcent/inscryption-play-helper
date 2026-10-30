import { createContext, useContext, useState, type ReactNode } from 'react';
import type { T } from './content';
import { rollD20 } from './game';

export type Lang = 0 | 1; // an index into a T: English, Spanish

export const LangContext = createContext<Lang>(1);

/** Picks a text in the current language. */
export function useT() {
  const lang = useContext(LangContext);
  return (text: T) => text[lang];
}

export const iconUrl = (icon: string) => `${import.meta.env.BASE_URL}icons/${icon}.png`;

export function Icon({ icon, size = 44 }: { icon: string; size?: number }) {
  return <span className="icon" style={{ width: size, height: size }}><img src={iconUrl(icon)} alt="" /></span>;
}

export function Card({ title, icon, active, children }: { title?: ReactNode; icon?: string; active?: boolean; children: ReactNode }) {
  return (
    <section className={`card${active ? ' active' : ''}`}>
      {(title || icon) && <h3 className="card-title">{icon && <Icon icon={icon} />}<span>{title}</span></h3>}
      {children}
    </section>
  );
}

export const Steps = ({ items }: { items: T[] }) => {
  const t = useT();
  return <ul className="steps">{items.map((s) => <li key={s[0]}>{t(s)}</li>)}</ul>;
};

/** A twenty-sided die for any rule that asks for it. */
export function D20({ hint }: { hint?: T }) {
  const t = useT();
  const [roll, setRoll] = useState<number | null>(null);
  return (
    <div className="d20">
      <button type="button" onClick={() => setRoll(rollD20(Math.random))}>{t(['Roll the d20', 'Tirar el d20'])}</button>
      {roll !== null && <b className="d20-result" aria-live="polite">{roll}</b>}
      {hint && <small>{t(hint)}</small>}
    </div>
  );
}

export function Choice({ icon, title, text, selected, disabled, note, onClick }: {
  icon?: string; title: string; text?: string; selected?: boolean; disabled?: boolean; note?: string; onClick: () => void;
}) {
  return (
    <button type="button" className={`choice${selected ? ' selected' : ''}`} disabled={disabled} onClick={onClick}>
      {icon && <Icon icon={icon} />}
      <span>
        <b>{title}</b>
        {note && <em>{note}</em>}
        {text && <small>{text}</small>}
      </span>
    </button>
  );
}
