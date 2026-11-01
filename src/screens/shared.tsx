/** What every screen shares: moves, names, the Next button, the candles. */
import { useEffect, useState } from 'react';
import * as G from '../game';
import type { Game, Player } from '../game';
import { useT } from '../ui';

/**
 * Applies a move; the app saves it and keeps it for undo. Moves with `history: false` (the scale)
 * are saved but not kept for undo: the players just move the tooth back.
 */
export type Move = (f: (g: Game) => Game, options?: { history?: boolean }) => void;
export interface ScreenProps { g: Game; move: Move }

export function useNames(g: Game) {
  const t = useT();
  return (p: Player) => g.names[p] || t([`Player ${p + 1}`, `Jugador ${p + 1}`]);
}

export const Next = ({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) => (
  <button type="button" className="primary next" onClick={onClick} disabled={disabled}>{label}</button>
);

export function useNextLabel() {
  const t = useT();
  return t(['Next', 'Siguiente']);
}

/** One candle per life that can be lost; `snuff` plays the candle that just went out. */
export function Lives({ g, snuff, compact }: { g: Game; snuff?: Player; compact?: boolean }) {
  const name = useNames(g);
  const t = useT();
  const candles = G.livesTotal(g) - 1;
  return (
    <div className={`lives${compact ? ' compact' : ''}`}>
      {([0, 1] as const).map((p) => (
        <div key={p}>
          <b>{name(p)}</b>
          <span
            className="candles"
            role="img"
            aria-label={t([`${G.livesTotal(g) - g.lost[p]} lives left`, `Le quedan ${G.livesTotal(g) - g.lost[p]} vidas`])}
          >
            {Array.from({ length: candles }, (_, i) => {
              const lit = i < candles - g.lost[p];
              const justOut = snuff === p && i === candles - g.lost[p];
              return <span key={i} className={`candle${lit ? '' : ' out'}${justOut ? ' snuffed' : ''}`}><i className="flame" /><b /></span>;
            })}
          </span>
        </div>
      ))}
    </div>
  );
}

/** The room dims for a moment when a life is lost. It leaves once it has played. */
export function Dim() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setOn(false), 1500);
    return () => clearTimeout(id);
  }, []);
  return on ? <div className="dim" /> : null;
}
