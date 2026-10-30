/**
 * The table in pseudo-3D, with CSS 3D transforms only: a tilted mat with cards, piles and standing pieces, and a camera
 * that moves to what the current step is about. Layout after the setup diagram in CrypticCrafter's rulebook.
 * All positions are in world units, 1180 across; --u is one unit on screen.
 */
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import type { T } from './content';
import { iconUrl, useLite, useMedia, useT } from './ui';

const W = 90; // a card
const H = 137;
const colX = (i: number) => 292 + i * 102;
const ROW_A = 50;
const ROW_B = 247;

const u = (n: number) => `calc(var(--u) * ${n})`;
const place = (x: number, y: number, w = W, h = H): CSSProperties => ({ left: u(x), top: u(y), width: u(w), height: u(h) });

export interface Focus { x: number; y: number; zoom: number }

// ---------- pieces ----------

interface Example { name: T; portrait: string; power?: number; health: number; cost?: string; sigil?: string; frame?: string; tilt?: number }

export const EXAMPLES: Record<string, Example> = {
  squirrel: { name: ['Squirrel', 'Ardilla'], portrait: 'squirrel', power: 0, health: 1 },
  stoat: { name: ['Stoat', 'Armiño'], portrait: 'stoat', power: 1, health: 3, cost: '1blood' },
  wolf: { name: ['Wolf', 'Lobo'], portrait: 'wolf', power: 3, health: 2, cost: '2blood' },
  raven: { name: ['Raven', 'Cuervo'], portrait: 'raven', power: 2, health: 3, cost: '2blood', sigil: 'ability_flying' },
  adder: { name: ['Adder', 'Víbora'], portrait: 'adder', power: 1, health: 1, cost: '2blood', sigil: 'ability_deathtouch' },
  mule: { name: ['Pack Mule', 'Mula de carga'], portrait: 'mule', power: 0, health: 5, frame: 'card_terrain_empty' },
  nugget: { name: ['Gold Nugget', 'Pepita de oro'], portrait: 'goldnugget', power: 0, health: 2, frame: 'card_terrain_empty' },
};

function CardFace({ id }: { id: string }) {
  const t = useT();
  const c = EXAMPLES[id];
  return (
    <div className="card-face" style={{ backgroundImage: `url(${iconUrl(`frames/${c.frame ?? 'card_empty'}`)})` }}>
      <span className="cf-name">{t(c.name)}</span>
      <img className="cf-portrait" src={iconUrl(`portraits/portrait_${c.portrait}`)} alt="" />
      {c.cost && <img className="cf-cost" src={iconUrl(`costs/cost_${c.cost}`)} alt="" />}
      {c.sigil && <img className="cf-sigil" src={iconUrl(`sigils/${c.sigil}`)} alt="" />}
      {c.power !== undefined && <span className="cf-power">{c.power}</span>}
      <span className="cf-health">{c.health}</span>
    </div>
  );
}

/** A card in a space, with its heart tokens behind it. `side`: which way "behind" is. */
export function BoardCard({ id, col, row, side = row, on }: { id: string; col: number; row: 0 | 1; side?: 0 | 1; on?: boolean }) {
  const hearts = EXAMPLES[id].health;
  const y = row === 0 ? ROW_A : ROW_B;
  return (
    <div className={`piece played${on ? ' on' : ''}`} style={place(colX(col), y)}>
      <div className="lift"><CardFace id={id} /></div>
      <div className="hearts" style={{ top: side === 0 ? u(-22) : u(H + 6) }}>
        {Array.from({ length: hearts }, (_, i) => <i key={i} style={{ animationDelay: `${450 + i * 70}ms` }} />)}
      </div>
    </div>
  );
}

/** A pile, with some height. */
export function Pile({ x, y, back = 'common', symbol, layers = 5, label, on }: { x: number; y: number; back?: string; symbol?: string; layers?: number; label?: string; on?: boolean }) {
  const src = `url(${iconUrl(`backs/${back}`)})`;
  const { lite } = useLite();
  if (lite) layers = 1;
  return (
    <div className={`piece pile${on ? ' on' : ''}`} style={place(x, y)}>
      {Array.from({ length: layers }, (_, i) => (
        <div
          key={i}
          className="layer"
          style={{ backgroundImage: src, transform: `translateZ(${u(i * 2.6)}) rotate(${(((i * 37) % 5) - 2) * 0.5}deg)` }}
        >
          {i === layers - 1 && symbol && <img src={iconUrl(symbol)} alt="" />}
        </div>
      ))}
      {label && <span className="pile-label">{label}</span>}
    </div>
  );
}

/** An empty dashed space for a pile that starts empty. */
const EmptyPile = ({ x, y, label, on }: { x: number; y: number; label: string; on?: boolean }) => (
  <div className={`piece pile empty${on ? ' on' : ''}`} style={place(x, y)}><span className="pile-label">{label}</span></div>
);

/** Stands up from the table: the plane turns on its bottom edge to face the camera. */
const Standing = ({ x, y, w, h, on, children }: { x: number; y: number; w: number; h: number; on?: boolean; children: ReactNode }) => (
  <div className={`piece standing${on ? ' on' : ''}`} style={place(x, y, w, h)}>
    <i className="shadow" />
    <div className="upright">{children}</div>
  </div>
);

export const Flame = () => <i className="flame" />;

const BoardCandle = ({ x, y, on, out }: { x: number; y: number; on?: boolean; out?: boolean }) => (
  <Standing x={x} y={y} w={18} h={46} on={on}>
    <span className={`candle${out ? ' out' : ''}`}><Flame /><b /></span>
  </Standing>
);

function Bell({ x, y, on }: { x: number; y: number; on?: boolean }) {
  return (
    <Standing x={x} y={y} w={54} h={54} on={on}>
      <svg className="bell" viewBox="0 0 40 40" aria-hidden="true">
        <path d="M20 4a3 3 0 0 1 3 3v1c6 2 8 8 8 14 0 5 2 7 4 9v2H5v-2c2-2 4-4 4-9 0-6 2-12 8-14V7a3 3 0 0 1 3-3z" fill="#b68a3e" stroke="#2a1a0c" strokeWidth="1.6" />
        <path d="M14 13c-2 3-2 7-2 11" stroke="#f0d48a" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="20" cy="36" r="3.4" fill="#7b5a24" stroke="#2a1a0c" />
      </svg>
    </Standing>
  );
}

/** The scale: a tray of 11 steps, with one tooth, or two for the Limoncello. */
function Scale({ x, y, on, teeth = [0] }: { x: number; y: number; on?: boolean; teeth?: number[] }) {
  const step = 25;
  return (
    <div className={`piece scale${on ? ' on' : ''}`} style={place(x, y, 44, step * 11 + 12)}>
      {Array.from({ length: 11 }, (_, i) => <i key={i} className={i === 5 ? 'zero' : ''} style={{ top: u(6 + i * step + step / 2) }} />)}
      {teeth.map((tooth, i) => (
        <svg key={i} className={`tooth tooth-${i}`} viewBox="0 0 20 24" style={{ top: u(6 + (5 - tooth) * step - 3) }} aria-hidden="true">
          <path d="M3 3c4-3 10-3 14 0 2 5 0 9-1 13-1 4-2 7-3 7-2 0-2-7-3-7s-1 7-3 7c-1 0-2-3-3-7C3 12 1 8 3 3z" fill="#f2e8d0" stroke="#3a2a18" strokeWidth="1.4" />
        </svg>
      ))}
    </div>
  );
}

/** A little heap of tokens. */
function Tokens({ x, y, kind, on, label }: { x: number; y: number; kind: 'bone' | 'heart'; on?: boolean; label?: string }) {
  const spots = [[12, 30], [42, 16], [66, 36], [30, 50], [58, 62], [14, 68]];
  return (
    <div className={`piece heap ${kind}${on ? ' on' : ''}`} style={place(x, y, W, W)}>
      {spots.map(([a, b], i) => <i key={i} style={{ left: u(a), top: u(b), transform: `translateZ(${u(1 + i)}) rotate(${i * 47}deg)` }} />)}
      {label && <span className="pile-label">{label}</span>}
    </div>
  );
}

// ---------- the table ----------

export function Mat({ names, labels }: { names: [string, string]; labels: boolean }) {
  const t = useT();
  return (
    <>
      <div className="mat" style={place(68, 4, 1096, 446)} />
      {[ROW_A, ROW_B].map((y, r) => [0, 1, 2, 3].map((c) => (
        <div key={`${r}${c}`} className="space" style={{ ...place(colX(c) - 4, y - 5, W + 8, H + 10), backgroundImage: `url(${iconUrl('frames/card_slot')})` }} />
      )))}
      <div className="order-arrow" style={place(colX(0), ROW_A + H + 21, 4 * W + 3 * 12, 16)} />
      {labels && (
        <>
          <span className="mat-name" style={place(colX(0), 12, 4 * W + 36, 28)}>{names[0]}</span>
          <span className="mat-name" style={place(colX(0), ROW_B + H + 22, 4 * W + 36, 28)}>{names[1]}</span>
        </>
      )}
      {labels && <span className="mat-order" style={place(colX(0), ROW_A + H + 2, 4 * W + 36, 20)}>{t(['cards act in this order', 'las cartas actúan en este orden'])}</span>}
    </>
  );
}

/** Offers light mode when the 3D table runs slowly on this device: counts frames for a moment after it opens. */
function useSlowTable(watching: boolean) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!watching) return;
    let frames = 0;
    let first = 0;
    let last = 0;
    let id = requestAnimationFrame(function tick(now) {
      // A long gap is a locked phone or a hidden tab, not a slow table: start counting again.
      if (!first || now - last > 500) { first = now; frames = 0; }
      last = now;
      frames++;
      if (now - first < 2500) { id = requestAnimationFrame(tick); return; }
      if ((frames / (now - first)) * 1000 < 26) setSlow(true);
    });
    return () => cancelAnimationFrame(id);
  }, [watching]);
  return slow;
}

/**
 * The scene. Children are placed in world units. Drag sideways to turn the table; the page still scrolls up and down.
 * In light mode it's the same layout seen flat from above, with no 3D and nothing to drag.
 */
export function Scene({ focus, height, children }: { focus: Focus; height?: number; children: ReactNode }) {
  const t = useT();
  const { lite, setLite } = useLite();
  const [turn, setTurn] = useState(0);
  const drag = useRef<{ x: number; start: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const slow = useSlowTable(!lite);
  const wide = useMedia('(min-width: 900px)');
  const style = {
    '--fx': focus.x,
    '--fy': focus.y,
    '--zoom': focus.zoom,
    '--turn': `${turn}deg`,
    height: height && !lite && !wide ? `${height}px` : undefined,
  } as CSSProperties;
  const stop = () => { drag.current = null; setDragging(false); };
  const handlers = lite ? {} : {
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
      drag.current = { x: e.clientX, start: turn };
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      if (drag.current) setTurn(Math.max(-24, Math.min(24, drag.current.start + (e.clientX - drag.current.x) * 0.25)));
    },
    onPointerUp: stop,
    onPointerCancel: stop,
  };
  return (
    <>
      <div className={`scene${dragging ? ' dragging' : ''}`} style={style} {...handlers}>
        <div className="lens">
          <div className="camera">
            <div className="table" />
            {children}
          </div>
        </div>
        <div className="scene-glow" />
      </div>
      {slow && !lite && (
        <p className="slow-note">
          {t(['The table looks slow on this device.', 'La mesa parece ir lenta en este dispositivo.'])}{' '}
          <button type="button" onClick={() => setLite(true)}>{t(['Use light mode', 'Usar el modo ligero'])}</button>
        </p>
      )}
    </>
  );
}

const OVERVIEW: Focus = { x: 600, y: 230, zoom: 1.02 };
const GRID: Focus = { x: colX(1) + 96, y: 228, zoom: 2.05 };
/** The play spaces in a scene as wide as the page: on a big screen they need less zoom to fill it. */
function useGridFocus(): Focus {
  return useMedia('(min-width: 900px)') ? { ...GRID, zoom: 1.5 } : GRID;
}

// ---------- the setup tour ----------

type Part = 'squirrels' | 'shared' | 'scale' | 'tokens' | 'kit' | 'decks' | 'played';
interface TourStep { title: T; text: T[]; focus: Focus[]; show?: Part; }

const SIDE_A = { x: 180, y: 130, zoom: 2.3 };
const SIDE_B = { x: 800, y: 300, zoom: 2.3 };

function tourSteps(kaycee: boolean, pelts: boolean): TourStep[] {
  return [
    { title: ['The board', 'El tablero'], text: [['You sit facing each other. Each player owns the 4 spaces on their side.', 'Os sentáis uno frente al otro. Cada jugador tiene los 4 espacios de su lado.']], focus: [OVERVIEW] },
    { title: ['Squirrels', 'Ardillas'], text: [['Deal each player 10 Squirrels in their squirrel space.', 'Reparte a cada jugador 10 Ardillas en su espacio de ardillas.']], focus: [SIDE_A, SIDE_B], show: 'squirrels' },
    { title: ['Shared piles', 'Montones compartidos'], text: [['Put the Item, Swap, Upgrade and Smoke cards in their shared spots. The draw pile goes here too.', 'Pon las cartas de objeto, intercambio, mejora y Humo en sus sitios compartidos. El mazo de robo también va aquí.']], focus: [{ x: 1020, y: 180, zoom: 2.2 }], show: 'shared' },
    {
      title: ['Scale, candles and bell', 'Balanza, velas y campana'],
      text: [
        ['Scale on the left with the tooth on zero, and the bell where both players can reach it.', 'La balanza a la izquierda con el diente en el cero, y la campana donde los dos lleguéis.'],
        kaycee ? ['Two lit candles for each player.', 'Dos velas encendidas por jugador.'] : ['One lit candle for each player.', 'Una vela encendida por jugador.'],
      ],
      focus: [{ x: 60, y: 230, zoom: 2.2 }],
      show: 'scale',
    },
    { title: ['Tokens', 'Fichas'], text: [['Bone and heart tokens within reach, and a sigil guide for each player.', 'Las fichas de hueso y de corazón a mano, y una guía de sellos para cada jugador.']], focus: [{ x: 1000, y: 380, zoom: 2.4 }], show: 'tokens' },
    kaycee
      ? {
        title: ['Kaycee’s Mod', 'Kaycee’s Mod'],
        text: [
          ['Keep near the board: totems, trials, boons, the patches, the Pack Mule, the event tokens and the d20.', 'Ten cerca del tablero: tótems, pruebas, bendiciones, los parches, la Mula de carga, las fichas de evento y el d20.'],
          ...(pelts ? [['Pelts in their own pile. Each player will shuffle a Rabbit Pelt into their deck after the draft.', 'Las pieles en su propio montón. Cada jugador barajará una Piel de conejo en su mazo después del reparto.'] as T] : []),
        ],
        focus: [{ x: 560, y: 520, zoom: 1.75 }],
        show: 'kit',
      }
      : { title: ['What stays in the box', 'Lo que se queda en la caja'], text: [['Leave the Kaycee’s Mod cards in the box (K back, totems, trials, boons, the Pack Mule, its items and the ship).', 'Deja en la caja las cartas de Kaycee’s Mod (dorso K, tótems, pruebas, bendiciones, la Mula, sus objetos y el barco).']], focus: [OVERVIEW] },
    { title: ['Your deck', 'Tu mazo'], text: [['After the draft, your deck goes here, with your dead pile beside it, empty for now.', 'Después del reparto, tu mazo va aquí, y al lado tu pila de muertos, vacía de momento.']], focus: [SIDE_A, SIDE_B], show: 'decks' },
    { title: ['During a round', 'Durante una ronda'], text: [['One card per space, with its heart tokens behind it. Each card strikes the one straight across; with nothing across, the damage goes to the scale.', 'Una carta por espacio, con sus fichas de corazón detrás. Cada carta golpea a la de justo enfrente; sin nada enfrente, el daño va a la balanza.']], focus: [GRID], show: 'played' },
  ];
}

const PARTS: Part[] = ['squirrels', 'shared', 'scale', 'tokens', 'kit', 'decks', 'played'];

export function BoardTour({ names, kaycee, pelts }: { names: [string, string]; kaycee: boolean; pelts: boolean }) {
  const t = useT();
  const steps = tourSteps(kaycee, pelts);
  const [at, setAt] = useState(0);
  const [pan, setPan] = useState(0);
  const step = steps[at];
  // A step about both sides of the table moves between them.
  useEffect(() => {
    setPan(0);
    if (step.focus.length < 2) return;
    const id = setInterval(() => setPan((p) => (p + 1) % step.focus.length), 2600);
    return () => clearInterval(id);
  }, [at, step.focus.length]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setAt((n) => Math.min(n + 1, steps.length - 1));
      if (e.key === 'ArrowLeft') setAt((n) => Math.max(n - 1, 0));
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [steps.length]);
  const lastShown = PARTS.indexOf(steps.slice(0, at + 1).map((s) => s.show).filter(Boolean).pop() ?? ('' as Part));
  const seen = (p: Part) => steps.slice(0, at + 1).some((s) => s.show === p) && PARTS.indexOf(p) <= lastShown;
  const on = (p: Part) => step.show === p;
  return (
    <div className="tour">
      <Scene focus={step.focus[pan] ?? step.focus[0]}>
        <Mat names={names} labels={at === 0 || step.show === 'played'} />
        {seen('squirrels') && (
          <>
            <Pile x={82} y={40} back="squirrel" on={on('squirrels')} label={t(['Squirrels', 'Ardillas'])} layers={7} />
            <Pile x={810} y={290} back="squirrel" on={on('squirrels')} label={t(['Squirrels', 'Ardillas'])} layers={7} />
          </>
        )}
        {seen('shared') && (
          <>
            <Pile x={925} y={20} on={on('shared')} layers={9} label={t(['Draw pile', 'Mazo de robo'])} />
            <Pile x={1045} y={20} on={on('shared')} back="item" label={t(['Items', 'Objetos'])} />
            <Pile x={925} y={170} on={on('shared')} back="smoke" layers={3} label={t(['Smoke', 'Humo'])} />
            <Pile x={1045} y={170} on={on('shared')} back="swap" label={t(['Swaps', 'Intercambios'])} />
            <Pile x={1045} y={312} on={on('shared')} back="upgrade" label={t(['Upgrades', 'Mejoras'])} />
          </>
        )}
        {seen('scale') && (
          <>
            <Scale x={16} y={90} on={on('scale')} teeth={[step.show === 'played' ? 2 : 0]} />
            {(kaycee ? [8, 36] : [22]).map((x) => <BoardCandle key={x} x={x} y={46} on={on('scale')} />)}
            {(kaycee ? [8, 36] : [22]).map((x) => <BoardCandle key={x} x={x} y={398} on={on('scale')} />)}
            <Bell x={72} y={380} on={on('scale')} />
          </>
        )}
        {seen('tokens') && (
          <>
            <Tokens x={925} y={325} kind="bone" on={on('tokens')} label={t(['Bones', 'Huesos'])} />
            <Tokens x={925} y={410} kind="heart" on={on('tokens')} label={t(['Hearts', 'Corazones'])} />
          </>
        )}
        {kaycee && seen('kit') && (
          <>
            <Pile x={200} y={470} on={on('kit')} back="totem" layers={5} label={t(['Totems', 'Tótems'])} />
            <Pile x={300} y={470} on={on('kit')} back="trial" layers={5} label={t(['Trials', 'Pruebas'])} />
            <Pile x={400} y={470} on={on('kit')} back="trial" symbol="trials/boonicon_doubledraw" layers={3} label={t(['Boons', 'Bendiciones'])} />
            <Pile x={500} y={470} on={on('kit')} back="mule" layers={1} label={t(['Pack Mule', 'Mula'])} />
            <div className={`piece kit-tokens${on('kit') ? ' on' : ''}`} style={place(610, 480, 120, 110)}>
              {['nodes/campfire', 'nodes/mushrooms', 'nodes/bossnode_leshy', 'nodes/removecardnode'].map((icon, i) => (
                <span key={icon} className="mini-token" style={{ left: u(i % 2 ? 62 : 2), top: u(i < 2 ? 0 : 54) }}><img src={iconUrl(icon)} alt="" /></span>
              ))}
              <span className="pile-label">{t(['Event tokens', 'Fichas de evento'])}</span>
            </div>
            <div className={`piece die-piece${on('kit') ? ' on' : ''}`} style={place(760, 496, 70, 70)}><span>20</span></div>
          </>
        )}
        {seen('decks') && (
          <>
            <Pile x={182} y={40} on={on('decks')} layers={6} label={t(['Deck', 'Mazo'])} />
            <EmptyPile x={132} y={258} on={on('decks')} label={t(['Dead', 'Muertos'])} />
            <Pile x={708} y={290} on={on('decks')} layers={6} label={t(['Deck', 'Mazo'])} />
            <EmptyPile x={760} y={70} on={on('decks')} label={t(['Dead', 'Muertos'])} />
          </>
        )}
        {seen('played') && (
          <>
            <BoardCard id="stoat" col={0} row={0} side={0} on />
            <BoardCard id="wolf" col={2} row={0} side={0} on />
            <BoardCard id="squirrel" col={0} row={1} side={1} on />
            <BoardCard id="raven" col={1} row={1} side={1} on />
            <BoardCard id="adder" col={3} row={1} side={1} on />
          </>
        )}
      </Scene>
      <div className="tour-side">
      <div className="tour-caption" aria-live="polite">
        <p className="tour-count">{at + 1} / {steps.length}</p>
        <h3>{t(step.title)}</h3>
        {step.text.map((line) => <p key={line[0]}>{t(line)}</p>)}
      </div>
      <div className="row">
        <button type="button" disabled={at === 0} onClick={() => setAt(at - 1)}>{t(['Back', 'Atrás'])}</button>
        <button type="button" disabled={at === steps.length - 1} onClick={() => setAt(at + 1)}>{t(['Next piece', 'Siguiente pieza'])}</button>
      </div>
      </div>
    </div>
  );
}

// ---------- boards for moments of the game ----------

/** A round in progress, for the reminders. */
export function ExampleBoard({ names }: { names: [string, string] }) {
  const focus = useGridFocus();
  return (
    <Scene focus={focus} height={300}>
      <Mat names={names} labels />
      <BoardCard id="stoat" col={0} row={0} side={0} />
      <BoardCard id="wolf" col={2} row={0} side={0} />
      <BoardCard id="squirrel" col={0} row={1} side={1} />
      <BoardCard id="raven" col={1} row={1} side={1} />
      <BoardCard id="adder" col={3} row={1} side={1} />
    </Scene>
  );
}

/** The Prospector's round: the mule starts on the loser's side (the near row), or he has struck. */
export function ProspectorBoard({ names, awake }: { names: [string, string]; awake: boolean }) {
  const focus = useGridFocus();
  return (
    <Scene focus={focus} height={280}>
      <Mat names={names} labels />
      <BoardCard id="mule" col={0} row={1} side={1} on={!awake} />
      {awake && <BoardCard id="nugget" col={2} row={0} side={0} on />}
      {awake && <BoardCard id="stoat" col={3} row={1} side={1} />}
      {awake && <BoardCard id="wolf" col={1} row={0} side={0} />}
    </Scene>
  );
}

/** The Limoncello: the ship in the middle of the far row, sailing; the players share the near one. */
export function LimoncelloBoard({ names }: { names: [string, string] }) {
  const t = useT();
  const focus = useGridFocus();
  return (
    <Scene focus={focus} height={320}>
      <Mat names={['', '']} labels={false} />
      <div className="ship" style={place(colX(1) + 6, ROW_A, 2 * W, H)}>
        <div className="ship-half" style={{ backgroundImage: `url(${iconUrl('frames/card_left_empty')})` }}>
          <img className="ship-art" src={iconUrl('portraits/portrait_limoncello_left_crew')} alt="" />
          <span className="cf-name">{t(['Limoncello’s', 'El Limoncello'])}</span>
          <img className="cf-sigil two-0" src={iconUrl('sigils/ability_halfstrike')} alt="" />
          <img className="cf-sigil two-1" src={iconUrl('sigils/ability_reach')} alt="" />
          <span className="cf-power">1</span>
        </div>
        <div className="ship-half" style={{ backgroundImage: `url(${iconUrl('frames/card_right_empty')})` }}>
          <img className="ship-art" src={iconUrl('portraits/portrait_limoncello_right_crew')} alt="" />
          <span className="cf-name">{t(['Skeleton Ship', 'Barco esqueleto'])}</span>
          <img className="cf-sigil two-0" src={iconUrl('sigils/ability_madeofstone')} alt="" />
          <img className="cf-sigil two-1" src={iconUrl('sigils/skeleton_mutiny')} alt="" />
          <span className="cf-health ship-health">40</span>
        </div>
      </div>
      <BoardCard id="stoat" col={1} row={1} side={1} />
      <BoardCard id="raven" col={3} row={1} side={1} />
      <span className="mat-name" style={place(colX(0), ROW_B + H + 22, 2 * W + 12, 28)}>{names[0]}</span>
      <span className="mat-name" style={place(colX(2), ROW_B + H + 22, 2 * W + 12, 28)}>{names[1]}</span>
      {[1, 2].map((c) => <i key={c} className="broadside" style={place(colX(c) + W / 2 - 8, ROW_A + H + 8, 16, 42)} />)}
    </Scene>
  );
}
