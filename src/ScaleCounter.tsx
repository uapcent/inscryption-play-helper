import { useId, type CSSProperties } from 'react';
import * as G from './game';
import type { Game, Player } from './game';
import type { Move } from './screens';
import { useT } from './ui';

/** The scale has no undo history: a wrong tap is fixed by moving the tooth back. */
const QUIET = { history: false };

/** The steps, left to right: 5 towards the left player, down to 0, up to 5 towards the right one. */
const STEPS = Array.from({ length: G.SCALE_MAX * 2 + 1 }, (_, i) => i - G.SCALE_MAX);
/** Where a step is along the tray, from 0 (left end) to 1 (right end). */
const along = (s: number) => (s + G.SCALE_MAX) / (G.SCALE_MAX * 2);

function GoldTooth({ at, nudge = 0 }: { at: number; nudge?: number }) {
  const id = useId();
  return (
    <svg className="gold-tooth" viewBox="0 0 20 24" aria-hidden="true" style={{ '--at': at, '--nudge': nudge } as CSSProperties}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff2b0" />
          <stop offset="0.45" stopColor="#e7b53c" />
          <stop offset="1" stopColor="#9a6a12" />
        </linearGradient>
      </defs>
      <path d="M3 3c4-3 10-3 14 0 2 5 0 9-1 13-1 4-2 7-3 7-2 0-2-7-3-7s-1 7-3 7c-1 0-2-3-3-7C3 12 1 8 3 3z" fill={`url(#${id})`} stroke="#3a2a18" strokeWidth="1.4" />
      <path d="M6 5c2-1 4-1 6 0" stroke="#fffbe6" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** The tray of 11 steps with its teeth. `ends` are the left and right players' names. */
function Tray({ ends, teeth, here, label, onStep }: {
  ends: [string, string];
  /** Each tooth's step, from -5 (left end) to 5 (right end). */
  teeth: number[];
  here: (s: number) => boolean;
  label: (s: number) => string;
  /** Null: that step can't be tapped. */
  onStep: (s: number) => (() => void) | null;
}) {
  const together = teeth.length > 1 && teeth.every((s) => s === teeth[0]);
  return (
    <>
      <div className="scale-ends">{ends.map((n, i) => <b key={i}>{n}</b>)}</div>
      <div className="scale-tray">
        {STEPS.map((s) => {
          const n = Math.abs(s);
          const tap = onStep(s);
          return (
            <button
              key={s}
              type="button"
              className={`scale-step${s === 0 ? ' zero' : ''}${n === 4 ? ' four' : ''}${n === 5 ? ' five' : ''}${here(s) ? ' here' : ''}`}
              aria-label={label(s)}
              aria-pressed={here(s)}
              disabled={!tap}
              onClick={tap ?? undefined}
            >{n}</button>
          );
        })}
        {/* Two teeth on the same step sit side by side. */}
        {teeth.map((s, i) => <GoldTooth key={i} at={along(s)} nudge={together ? (i === 0 ? -1 : 1) : 0} />)}
      </div>
    </>
  );
}

/**
 * The scale, kept on screen through the round: the gold tooth moves towards whoever takes damage.
 * Tap a player's button for each point of damage they take, or tap a step to put the tooth there.
 */
export function ScaleCounter({ g, move, names }: { g: Game; move: Move; names: [string, string] }) {
  const t = useT();
  const { scale } = g;
  const at = (p: Player) => G.scaleAgainst(g, p);
  const where = scale === 0
    ? t(['The scale is even', 'La balanza está equilibrada'])
    : t([`${Math.abs(scale)} against ${names[scale < 0 ? 0 : 1]}`, `${Math.abs(scale)} en contra de ${names[scale < 0 ? 0 : 1]}`]);
  return (
    <section className="scale-bar" aria-label={t(['The scale', 'La balanza'])}>
      <Tray
        ends={names}
        teeth={[scale]}
        here={(s) => s === scale}
        label={(s) => (s === 0
          ? t(['Put the tooth on 0', 'Poner el diente en el 0'])
          : t([`Put the tooth on ${Math.abs(s)} against ${names[s < 0 ? 0 : 1]}`, `Poner el diente en ${Math.abs(s)} en contra de ${names[s < 0 ? 0 : 1]}`]))}
        onStep={(s) => () => move((x) => G.setScale(x, s < 0 ? 0 : 1, Math.abs(s)), QUIET)}
      />
      <p className="scale-where" aria-live="polite">{where}</p>
      <div className="scale-hits">
        {([0, 1] as const).map((p) => (
          <button key={p} type="button" className="hit" disabled={at(p) >= G.SCALE_MAX} onClick={() => move((x) => G.tipScale(x, p, 1), QUIET)}>
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

/**
 * The Limoncello's scale: one gold tooth per player, both on 0 at the start. The ship's hits on a
 * player's empty column move their tooth towards their end; at 5 they are out.
 * The player on the left plays the left columns.
 */
export function LimoncelloScale({ g, move, left, names }: { g: Game; move: Move; left: Player; names: [string, string] }) {
  const t = useT();
  const right = G.other(left);
  // A step, from -5 to 5, as the player it belongs to and how far along their side it is.
  const owner = (s: number): Player => (s < 0 ? left : right);
  const stepOf = (p: Player) => (p === left ? -1 : 1) * G.toothOf(g, p);
  const ends: [string, string] = [names[left], names[right]];
  const out = ([0, 1] as const).filter((p) => G.isOut(g, p));
  return (
    <section className="scale-bar" aria-label={t(['The scale: both teeth', 'La balanza: los dos dientes'])}>
      <Tray
        ends={ends}
        teeth={[stepOf(left), stepOf(right)]}
        here={(s) => s === stepOf(left) || s === stepOf(right)}
        label={(s) => (s === 0
          ? t(['The middle: both teeth start here', 'El centro: los dos dientes empiezan aquí'])
          : t([`Put ${names[owner(s)]}’s tooth on ${Math.abs(s)}`, `Poner el diente de ${names[owner(s)]} en el ${Math.abs(s)}`]))}
        onStep={(s) => (s === 0 ? null : () => move((x) => G.setTooth(x, owner(s), Math.abs(s)), QUIET))}
      />
      <p className="scale-where" aria-live="polite">
        {([left, right] as const).map((p) => `${names[p]}: ${G.toothOf(g, p)}`).join(' · ')}
      </p>
      <div className="scale-hits">
        {([left, right] as const).map((p) => (
          <div key={p} className="scale-hit">
            <button type="button" aria-label={t([`Take 1 back from ${names[p]}`, `Quitar 1 a ${names[p]}`])} disabled={G.toothOf(g, p) <= 0} onClick={() => move((x) => G.hitTooth(x, p, -1), QUIET)}>−1</button>
            <button type="button" className="hit" disabled={G.isOut(g, p)} onClick={() => move((x) => G.hitTooth(x, p, 1), QUIET)}>
              {t([`+1 to ${names[p]}`, `+1 a ${names[p]}`])}
            </button>
          </div>
        ))}
      </div>
      {out.length === 1 && (
        <p className="warning">{t([
          `${names[out[0]]} is out: they stop drawing and playing, but their cards stay and attack. ${names[G.other(out[0])]} takes every empty column’s hits.`,
          `${names[out[0]]} queda fuera: ya no roba ni juega, pero sus cartas se quedan y atacan. ${names[G.other(out[0])]} recibe los golpes de todas las columnas vacías.`,
        ])}</p>
      )}
      {out.length === 2 && (
        <button type="button" className="danger wide" onClick={() => move(G.toLimoncelloEnd)}>
          {t(['Both teeth at 5: the ship wins', 'Los dos dientes en 5: gana el barco'])}
        </button>
      )}
    </section>
  );
}
