import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Mat, Pile, Scene } from './Board';
import type { T } from './content';
import faces from './data/faces.json';
import { EVOLUTION_LINES, tutorialById, type Piece } from './tutorials';
import { Die, iconUrl, useT } from './ui';

interface Face { n: T; p?: string | null; f?: string; c?: string | null; a?: string | null; h?: string | null; g?: string[]; full?: string }
const FACES = faces as unknown as Record<string, Face>;

const u = (n: number) => `calc(var(--u) * ${n})`;
const place = (x: number, y: number, w: number, h: number): CSSProperties => ({ left: u(x), top: u(y), width: u(w), height: u(h) });
const W = 90;
const H = 137;
const FOCUS = { x: 540, y: 268, zoom: 1.92 };

function PieceFace({ id, power }: { id: string; power?: string }) {
  const t = useT();
  const f = FACES[id];
  if (f.full) return <div className="card-face" key={id} style={{ backgroundImage: `url(${iconUrl(f.full)})` }} />;
  const statIcon = f.a?.startsWith('icon:') ? f.a.slice(5) : null;
  const sigils = f.g ?? [];
  return (
    <div className="card-face flip" key={id} style={{ backgroundImage: `url(${iconUrl(`frames/${f.f}`)})` }}>
      <span className="cf-name">{t(f.n)}</span>
      {f.p && <img className="cf-portrait" src={iconUrl(`portraits/${f.p}`)} alt="" />}
      {f.c && <img className="cf-cost" src={iconUrl(`costs/${f.c}`)} alt="" />}
      {sigils.map((s, i) => <img key={s} className={`cf-sigil${sigils.length > 1 ? ` two-${i}` : ''}`} src={iconUrl(`sigils/${s}`)} alt="" />)}
      {statIcon && !power && <img className="cf-stat" src={iconUrl(`stats/${statIcon}_stat_icon`)} alt="" />}
      {(power ?? (statIcon ? undefined : f.a)) != null && <span className="cf-power">{power ?? f.a}</span>}
      {f.h && <span className="cf-health">{f.h}</span>}
    </div>
  );
}

function BoardPiece({ p }: { p: Piece }) {
  const t = useT();
  if (p.back && p.label) return <Pile x={p.x} y={p.y} back={p.back} layers={5} label={t(p.label)} on={p.on} />;
  const near = p.y > 200;
  const hearts = p.hearts ?? (p.face ? Number(FACES[p.face]?.h) || 0 : 0);
  return (
    <div className={`piece tpiece${p.on ? ' on' : ''}`} style={place(p.x, p.y, W, H)}>
      <div className="lift">
        {p.back
          ? <div className="card-face" style={{ backgroundImage: `url(${iconUrl(`backs/${p.back}`)})` }} />
          : <PieceFace id={p.face!} power={p.power} />}
      </div>
      {hearts > 0 && <div className="hearts" style={{ top: near ? u(H + 6) : u(-22) }}>{Array.from({ length: hearts }, (_, i) => <i key={i} />)}</div>}
      {p.badge && <span className="piece-badge">{typeof p.badge === 'string' ? p.badge : t(p.badge)}</span>}
    </div>
  );
}

/** Bold in a caption, written **like this**. */
function Rich({ text }: { text: string }) {
  const parts: ReactNode[] = text.split('**').map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part));
  return <>{parts}</>;
}

/** One tutorial, step by step, on the same table as the setup tour (flat in light mode). */
export function TutorialPlayer({ id, kaycee }: { id: string; kaycee: boolean }) {
  const t = useT();
  const tutorial = tutorialById(id)!;
  const [at, setAt] = useState(0);
  const step = tutorial.steps[at];
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setAt((n) => Math.min(n + 1, tutorial.steps.length - 1));
      if (e.key === 'ArrowLeft') setAt((n) => Math.max(n - 1, 0));
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [tutorial.steps.length]);
  return (
    <div className="tutorial">
      <Scene focus={FOCUS}>
        <Mat names={['', '']} labels={false} />
        <span className="mat-name side-name" style={place(254, 54, 28, 130)}>{t(['Adversary', 'Adversario'])}</span>
        <span className="mat-name side-name" style={place(254, 251, 28, 130)}>{t(['You', 'Tú'])}</span>
        {step.pieces.map((p) => <BoardPiece key={p.key} p={p} />)}
        {(step.hits ?? []).map(([col, dir]) => (
          <i key={`${at}-${col}`} className={`broadside${dir === 0 ? ' up' : ''}`} style={place(292 + col * 102 + W / 2 - 8, 195, 16, 42)} />
        ))}
      </Scene>
      <div className="tour-caption" aria-live="polite">
        <p className="tour-count">{at + 1} / {tutorial.steps.length}</p>
        {step.roll !== undefined && <div className="tutorial-die"><Die value={step.roll} rollKey={at} /></div>}
        <p><Rich text={t(step.text)} /></p>
      </div>
      <div className="row">
        <button type="button" disabled={at === 0} onClick={() => setAt(at - 1)}>{t(['Back', 'Atrás'])}</button>
        <button type="button" disabled={at === tutorial.steps.length - 1} onClick={() => setAt(at + 1)}>{t(['Next', 'Siguiente'])}</button>
      </div>
      {tutorial.lines && (
        <section className="evolution-lines">
          <h3>{t(['Every card that evolves', 'Todas las cartas que evolucionan'])}</h3>
          <ul className="steps">
            {EVOLUTION_LINES.filter((l) => kaycee || !l.kaycee).map((l) => <li key={l.line[0]}>{t(l.line)}</li>)}
          </ul>
          <p className="muted note">{t(['The Curious Egg is different: it hatches when all the tribes are on the board. The stronger forms are in the Upgrades pile.', 'El Huevo curioso es distinto: eclosiona cuando todas las tribus están en el tablero. Las formas más fuertes están en el montón de mejoras.'])}</p>
        </section>
      )}
    </div>
  );
}
