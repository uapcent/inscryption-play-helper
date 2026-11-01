import { useState } from 'react';
import * as G from './game';
import type { Game, Player } from './game';
import type { Move } from './Screens';
import { useT } from './ui';

/** Like the scale, these counters have no undo history: a wrong tap is fixed with the other button. */
const QUIET = { history: false };

const Bone = () => (
  <svg className="bone" viewBox="0 0 32 16" aria-hidden="true">
    <path d="M7 2a3.5 3.5 0 0 1 3.3 4.7h11.4A3.5 3.5 0 1 1 25 11.3a3.5 3.5 0 1 1-3.3 4.7H10.3A3.5 3.5 0 1 1 7 11.3 3.5 3.5 0 1 1 7 2z" transform="translate(0 -1.5) scale(1 0.95)" fill="#f4ead6" stroke="#21140b" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

/** Each player's bones, with a button to gain one and one to spend. */
export function BonesCounter({ g, move, names }: { g: Game; move: Move; names: [string, string] }) {
  const t = useT();
  return (
    <div className="bones">
      {([0, 1] as const).map((p) => (
        <div key={p} className="bones-player">
          <b>{names[p]}</b>
          <div className="bones-row">
            <button type="button" aria-label={t([`${names[p]} spends a bone`, `${names[p]} gasta un hueso`])} disabled={g.bones[p] <= 0} onClick={() => move((x) => G.addBones(x, p, -1), QUIET)}>−</button>
            <span className="bones-count" aria-live="polite" aria-label={t([`${names[p]}: ${g.bones[p]} bones`, `${names[p]}: ${g.bones[p]} huesos`])}>
              <Bone />{g.bones[p]}
            </span>
            <button type="button" aria-label={t([`${names[p]} gains a bone`, `${names[p]} gana un hueso`])} onClick={() => move((x) => G.addBones(x, p, 1), QUIET)}>+</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * The 8 spaces of the board, with the damage on the card in each. Tap a space, then add or take
 * back damage; when the card dies or leaves, clear it; when it moves, its damage moves along.
 */
export function DamageBoard({ g, move, names }: { g: Game; move: Move; names: [string, string] }) {
  const t = useT();
  const [sel, setSel] = useState<[Player, number] | null>(null);
  const [moving, setMoving] = useState(false);
  const spaceName = (p: Player, c: number) => t([`${names[p]}, space ${c + 1}`, `${names[p]}, espacio ${c + 1}`]);
  const tap = (p: Player, c: number) => {
    if (moving && sel) {
      if (sel[0] !== p || sel[1] !== c) move((x) => G.moveDamage(x, sel, [p, c]), QUIET);
      setSel([p, c]);
      setMoving(false);
      return;
    }
    setSel(sel && sel[0] === p && sel[1] === c ? null : [p, c]);
  };
  const at = sel ? G.damageAt(g, ...sel) : 0;
  const hurt = (n: number) => sel && move((x) => G.hurt(x, sel[0], sel[1], n), QUIET);
  return (
    <div className="damage-board">
      {([0, 1] as const).map((p) => (
        <div key={p} className="damage-side">
          <b className="damage-name">{names[p]}</b>
          <div className="damage-row">
            {Array.from({ length: G.COLUMNS }, (_, c) => {
              const d = G.damageAt(g, p, c);
              const on = !!sel && sel[0] === p && sel[1] === c;
              return (
                <button
                  key={c}
                  type="button"
                  className={`damage-space${d ? ' hurt' : ''}${on ? ' on' : ''}${moving && !on ? ' target' : ''}`}
                  aria-pressed={on}
                  aria-label={`${spaceName(p, c)}: ${d ? t([`${d} damage`, `${d} de daño`]) : t(['no damage', 'sin daño'])}`}
                  onClick={() => tap(p, c)}
                >
                  {d > 0 && <span className="damage-count">{d}</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {sel ? (
        <div className="damage-tools">
          <p className="damage-where" aria-live="polite">
            {moving
              ? t(['Tap the space the card moved to.', 'Toca el espacio al que se ha movido la carta.'])
              : `${spaceName(...sel)}: ${at ? t([`${at} damage`, `${at} de daño`]) : t(['no damage', 'sin daño'])}`}
          </p>
          <div className="damage-hits">
            <button type="button" aria-label={t(['Take 1 damage back', 'Quitar 1 de daño'])} disabled={at <= 0 || moving} onClick={() => hurt(-1)}>−1</button>
            {[1, 2, 3].map((n) => <button key={n} type="button" className="hit" disabled={moving} onClick={() => hurt(n)}>+{n}</button>)}
          </div>
          <div className="row">
            <button type="button" className={moving ? 'on' : ''} aria-pressed={moving} onClick={() => setMoving(!moving)}>{moving ? t(['Cancel the move', 'Cancelar']) : t(['It moved', 'Se ha movido'])}</button>
            <button type="button" disabled={at <= 0 || moving} onClick={() => { move((x) => G.clearDamage(x, sel[0], sel[1]), QUIET); setSel(null); }}>{t(['It died or left: clear', 'Ha muerto o se ha ido: borrar'])}</button>
          </div>
        </div>
      ) : (
        <p className="muted note">{t(['Tap a space to mark the damage on its card.', 'Toca un espacio para apuntar el daño de su carta.'])}</p>
      )}
    </div>
  );
}
