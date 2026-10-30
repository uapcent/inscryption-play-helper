import { createContext, useContext, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
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

/** Light mode: no 3D and no animation, for phones that lag. On by default only on very weak devices. */
export function defaultLite() {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) || (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 2);
}
export const LiteContext = createContext<{ lite: boolean; setLite: (on: boolean) => void }>({ lite: false, setLite: () => {} });
export const useLite = () => useContext(LiteContext);
let liteNow = false;
export const noteLite = (on: boolean) => { liteNow = on; };

/** True while the media query matches; follows the window as it's resized. */
export function useMedia(query: string) {
  const [on, setOn] = useState(() => matchMedia(query).matches);
  useEffect(() => {
    const m = matchMedia(query);
    const change = () => setOn(m.matches);
    change();
    m.addEventListener('change', change);
    return () => m.removeEventListener('change', change);
  }, [query]);
  return on;
}

const calm = () => liteNow || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
/** How long an animation should hold back what comes after it. */
export const motionMs = (ms: number) => (calm() ? 0 : ms);

/** False for `ms` after it mounts or `key` changes, then true: what follows an animation waits for this. */
export function useSettled(ms: number, key: unknown = 0) {
  const [settled, setSettled] = useState(() => motionMs(ms) === 0);
  useEffect(() => {
    if (motionMs(ms) === 0) return;
    setSettled(false);
    const id = setTimeout(() => setSettled(true), ms);
    return () => clearTimeout(id);
  }, [ms, key]);
  return settled;
}

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

/** A twenty-sided die: tumbles, showing passing numbers, and lands on `value`. */
export function Die({ value, rollKey }: { value: number; rollKey: unknown }) {
  const settled = useSettled(1000, rollKey);
  const [passing, setPassing] = useState(value);
  useEffect(() => {
    if (settled) return;
    const id = setInterval(() => setPassing(rollD20(Math.random)), 70);
    return () => clearInterval(id);
  }, [settled]);
  return (
    <span className={`die${settled ? ' landed' : ' rolling'}`} key={String(rollKey)} aria-live="polite" aria-label={settled ? String(value) : undefined}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <polygon points="50,3 91,27 91,73 50,97 9,73 9,27" className="die-body" />
        <polygon points="50,24 76,68 24,68" className="die-face" />
        <path d="M50 3 50 24M9 27 50 24 91 27M9 27 24 68 9 73M91 27 76 68 91 73M24 68 50 97 76 68" className="die-lines" />
      </svg>
      <b>{settled ? value : passing}</b>
    </span>
  );
}

/** A die for any rule that asks for one. */
export function D20({ hint }: { hint?: T }) {
  const t = useT();
  const [roll, setRoll] = useState<{ value: number; n: number } | null>(null);
  return (
    <div className="d20">
      <button type="button" onClick={() => setRoll((r) => ({ value: rollD20(Math.random), n: (r?.n ?? 0) + 1 }))}>{t(['Roll the d20', 'Tirar el d20'])}</button>
      {roll && <Die value={roll.value} rollKey={roll.n} />}
      {hint && <small>{t(hint)}</small>}
    </div>
  );
}

/** A coin that flips and lands on `face`. The player's name is on each side. */
export function Coin({ faces, face, flipping }: { faces: [string, string]; face: 0 | 1 | null; flipping: boolean }) {
  const style = { '--end': `${face === 1 ? 1980 : 1800}deg`, '--rest': `${face === 1 ? 180 : 0}deg` } as CSSProperties;
  return (
    <div className={`coin-stage${flipping ? ' flipping' : ''}`} style={style}>
      <div className="coin-shadow" />
      <div className="coin-jump">
        <div className="coin">
          <div className="coin-side front"><span>{faces[0]}</span></div>
          <div className="coin-side back"><span>{faces[1]}</span></div>
        </div>
      </div>
    </div>
  );
}

/** A round event token: lands face down from the bag, then turns over. */
export function Token({ icon, group, i = 0, small }: { icon: string; group: 'upgrade' | 'challenge'; i?: number; small?: boolean }) {
  return (
    <span className={`token ${group}${small ? ' small' : ''}`} style={{ '--i': i } as CSSProperties}>
      <span className="token-spin">
        <span className="token-side token-back" />
        <span className="token-side token-front"><img src={iconUrl(icon)} alt="" /></span>
      </span>
    </span>
  );
}

export function Choice({ icon, token, title, text, selected, disabled, note, i, onClick }: {
  icon?: string; token?: ReactNode; title: string; text?: string; selected?: boolean; disabled?: boolean; note?: string; i?: number; onClick: () => void;
}) {
  return (
    <button type="button" className={`choice${selected ? ' selected' : ''}${i !== undefined ? ' dealt' : ''}`} style={i !== undefined ? { '--i': i } as CSSProperties : undefined} disabled={disabled} onClick={onClick}>
      {token}
      {icon && <Icon icon={icon} />}
      <span className="choice-text">
        <b>{title}</b>
        {note && <em>{note}</em>}
        {text && <small>{text}</small>}
      </span>
    </button>
  );
}
