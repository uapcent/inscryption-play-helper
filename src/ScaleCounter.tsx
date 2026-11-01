import type { CSSProperties } from 'react';
import * as G from './game';
import type { Game, Player } from './game';
import type { Move } from './Screens';
import { useT } from './ui';

/** The steps, left to right: 5 against the first player, down to 0, up to 5 against the second. */
const STEPS = Array.from({ length: G.SCALE_MAX * 2 + 1 }, (_, i) => i - G.SCALE_MAX);

/**
 * The scale, kept on screen through the round: the gold tooth moves towards whoever takes damage.
 * Tap a player's button for each point of damage they take, or tap a step to put the tooth there.
 */
export function ScaleCounter({ g, move, names }: { g: Game; move: Move; names: [string, string] }) {
  const t = useT();
  const scale = g.scale ?? 0;
  const at = (p: Player) => G.scaleAgainst(g, p);
  const where = scale === 0
    ? t(['The scale is even', 'La balanza está equilibrada'])
    : t([`${Math.abs(scale)} against ${names[scale < 0 ? 0 : 1]}`, `${Math.abs(scale)} en contra de ${names[scale < 0 ? 0 : 1]}`]);
  return (
    <section className="scale-bar" aria-label={t(['The scale', 'La balanza'])}>
      <div className="scale-ends">
        {([0, 1] as const).map((p) => <b key={p} className={at(p) >= 4 ? 'warn' : ''}>{names[p]}</b>)}
      </div>
      <div className="scale-tray" style={{ '--at': (scale + G.SCALE_MAX) / (G.SCALE_MAX * 2) } as CSSProperties}>
        {STEPS.map((s) => {
          const p: Player = s < 0 ? 0 : 1;
          const n = Math.abs(s);
          return (
            <button
              key={s}
              type="button"
              className={`scale-step${s === 0 ? ' zero' : ''}${n === 4 ? ' four' : ''}${n === 5 ? ' five' : ''}${s === scale ? ' here' : ''}`}
              aria-label={s === 0 ? t(['Put the tooth on 0', 'Poner el diente en el 0']) : t([`Put the tooth on ${n} against ${names[p]}`, `Poner el diente en ${n} en contra de ${names[p]}`])}
              aria-pressed={s === scale}
              onClick={() => move((x) => G.setScale(x, p, n))}
            >{n}</button>
          );
        })}
        <svg className="gold-tooth" viewBox="0 0 20 24" aria-hidden="true">
          <defs>
            <linearGradient id="gold-tooth-fill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff2b0" />
              <stop offset="0.45" stopColor="#e7b53c" />
              <stop offset="1" stopColor="#9a6a12" />
            </linearGradient>
          </defs>
          <path d="M3 3c4-3 10-3 14 0 2 5 0 9-1 13-1 4-2 7-3 7-2 0-2-7-3-7s-1 7-3 7c-1 0-2-3-3-7C3 12 1 8 3 3z" fill="url(#gold-tooth-fill)" stroke="#3a2a18" strokeWidth="1.4" />
          <path d="M6 5c2-1 4-1 6 0" stroke="#fffbe6" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </svg>
      </div>
      <p className="scale-where" aria-live="polite">{where}</p>
      <div className="scale-hits">
        {([0, 1] as const).map((p) => (
          <button key={p} type="button" className="hit" disabled={at(p) >= G.SCALE_MAX} onClick={() => move((x) => G.tipScale(x, p, 1))}>
            {t([`+1 to ${names[p]}`, `+1 a ${names[p]}`])}
          </button>
        ))}
      </div>
      {([0, 1] as const).map((p) => at(p) === 4 && (
        <p key={p} className="warning">{t([`4 against ${names[p]}: they draw an item.`, `4 en contra de ${names[p]}: roba un objeto.`])}</p>
      ))}
      {([0, 1] as const).map((p) => at(p) >= G.SCALE_MAX && (
        <button key={p} type="button" className="danger wide" onClick={() => move((x) => G.loseLife(x, p))}>
          {t([`5 against ${names[p]}: they lose a life`, `5 en contra de ${names[p]}: pierde una vida`])}
        </button>
      ))}
    </section>
  );
}
