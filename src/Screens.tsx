import { useContext, useEffect, useState } from 'react';
import { GROUPS } from './CardSheet';
import { CardsView } from './CardsView';
import { TRICKY_CARDS } from './notes';
import { BoardTour, ExampleBoard, LimoncelloBoard, ProspectorBoard } from './Board';
import {
  ALWAYS, ALWAYS_BASE, ALWAYS_KAYCEE, BOON_TEXT, DEATH_CARD_STEPS, EVENTS, HEAD_ICONS, HEAD_NAMES, TRIALS, TURN_STEPS,
} from './content';
import * as G from './game';
import type { Activity, Carry, Game, Player, Token } from './game';
import { sigilByKey } from './Sigils';
import { CardSheetContext, Card, Choice, Coin, D20, Die, Steps, Token as EventToken, motionMs, useLite, useMedia, useSettled, useT } from './ui';

/** Applies a move; the app saves it and keeps it for undo. */
export type Move = (f: (g: Game) => Game) => void;
export interface ScreenProps { g: Game; move: Move }

function useNames(g: Game) {
  const t = useT();
  return (p: Player) => g.names[p] || t([`Player ${p + 1}`, `Jugador ${p + 1}`]);
}

const Next = ({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) => (
  <button type="button" className="primary next" onClick={onClick} disabled={disabled}>{label}</button>
);

function useNextLabel() {
  const t = useT();
  return t(['Next', 'Siguiente']);
}

// ---------- before the game ----------

export function SetupScreen({ g, move }: ScreenProps) {
  const t = useT();
  const [kaycee, setKaycee] = useState(g.kaycee);
  const [pelts, setPelts] = useState(g.pelts);
  const [names, setNames] = useState<[string, string]>(g.names);
  const { lite, setLite } = useLite();
  return (
    <>
      <h1>{t(['New game', 'Nueva partida'])}</h1>
      <p className="lead">{t(['Choose what you’re playing with. The helper tells each player what to do between rounds and reminds you of the rules during each round.', 'Elige con qué jugáis. La ayuda le dice a cada jugador qué hacer entre rondas y os recuerda las reglas durante cada ronda.'])}</p>
      <Card title={t(['Expansions', 'Expansiones'])}>
        <label className="toggle"><input type="checkbox" checked disabled /><span><b>{t(['Base game', 'Juego base'])}</b><small>{t(['2 lives, up to 3 rounds, no events.', '2 vidas, hasta 3 rondas, sin eventos.'])}</small></span></label>
        <label className="toggle"><input type="checkbox" checked={kaycee} onChange={(e) => setKaycee(e.target.checked)} /><span><b>Kaycee’s Mod</b><small>{t(['3 lives, up to 5 rounds, events between rounds and two bosses.', '3 vidas, hasta 5 rondas, eventos entre rondas y dos jefes.'])}</small></span></label>
        <label className="toggle"><input type="checkbox" checked={kaycee && pelts} disabled={!kaycee} onChange={(e) => setPelts(e.target.checked)} /><span><b>{t(['Pelts', 'Pieles'])}</b><small>{t(['The Trading Post and the bone bank. Needs Kaycee’s Mod.', 'La Casa de comercio y el banco de huesos. Necesita Kaycee’s Mod.'])}</small></span></label>
      </Card>
      <Card title={t(['Players', 'Jugadores'])}>
        {([0, 1] as const).map((p) => (
          <input
            key={p}
            className="name"
            maxLength={16}
            placeholder={t([`Player ${p + 1}`, `Jugador ${p + 1}`])}
            aria-label={t([`Player ${p + 1}`, `Jugador ${p + 1}`])}
            value={names[p]}
            onChange={(e) => setNames(p === 0 ? [e.target.value, names[1]] : [names[0], e.target.value])}
          />
        ))}
      </Card>
      <Card title={t(['Performance', 'Rendimiento'])}>
        <label className="toggle"><input type="checkbox" checked={lite} onChange={(e) => setLite(e.target.checked)} /><span><b>{t(['Light mode', 'Modo ligero'])}</b><small>{t(['A flat board and no animations, for phones that lag. You can change it at any time at the bottom of the page.', 'Tablero plano y sin animaciones, para móviles que van lentos. Puedes cambiarlo cuando quieras al final de la página.'])}</small></span></label>
      </Card>
      <Next label={t(['Start', 'Empezar'])} onClick={() => move((s) => G.start(s, { kaycee, pelts, names: [names[0].trim(), names[1].trim()] }))} />
    </>
  );
}

export function CardsScreen({ g, move }: ScreenProps) {
  const t = useT();
  return (
    <>
      <CardsView kaycee={g.kaycee} pelts={g.pelts} />
      <Next label={t(['To the table', 'A la mesa'])} onClick={() => move(G.toPrepare)} />
    </>
  );
}

export function PrepareScreen({ g, move }: ScreenProps) {
  const t = useT();
  const name = useNames(g);
  const { lite } = useLite();
  return (
    <>
      <h1>{t(['Setup', 'Preparación'])}</h1>
      <p className="note muted">{lite
        ? t(['Follow the pieces onto the table.', 'Sigue las piezas sobre la mesa.'])
        : t(['Follow the pieces onto the table. Drag sideways to turn it.', 'Sigue las piezas sobre la mesa. Arrastra de lado para girarla.'])}</p>
      <BoardTour names={[name(0), name(1)]} kaycee={g.kaycee} pelts={g.pelts} />
      <Next label={t(['To the draft', 'Al reparto'])} onClick={() => move(G.toDraft)} />
    </>
  );
}

export function DraftScreen({ g, move }: ScreenProps) {
  const t = useT();
  const name = useNames(g);
  const total = g.kaycee ? 12 : 20;
  return (
    <>
      <h1>{t(['The draft', 'El reparto'])}</h1>
      <p className="lead">{t([`Each player builds a deck of ${total} cards, out in the open.`, `Cada jugador se hace un mazo de ${total} cartas, a la vista.`])}</p>
      <Card>
        <ol className="steps">
          <li>{t(['Shuffle the rares into the draw pile.', 'Baraja las raras en el mazo de robo.'])}</li>
          <li>{t(['Lay 3 cards face up.', 'Pon 3 cartas boca arriba.'])}</li>
          <li>{t([`${name(0)} picks one, then ${name(1)}. The last one goes to the side.`, `${name(0)} elige una, después ${name(1)}. La última se aparta.`])}</li>
          <li>{t([`Repeat until you both have ${total / 2} cards, then ${name(1)} picks first until you both have ${total}.`, `Repetid hasta tener ${total / 2} cartas cada uno; después elige primero ${name(1)} hasta tener ${total}.`])}</li>
          {g.kaycee
            ? <li>{t(['Keep the cards nobody drafted as the leftover pile: the events take cards from it.', 'Guarda las cartas que nadie eligió como montón sobrante: los eventos sacan cartas de él.'])}</li>
            : <li>{t(['All other cards go back: they aren’t used this game.', 'El resto de cartas vuelve: no se usan en esta partida.'])}</li>}
          {g.pelts && <li>{t(['Each player adds a Rabbit Pelt to their deck.', 'Cada jugador añade una Piel de conejo a su mazo.'])}</li>}
          <li>{t(['Shuffle your deck and put it on your draw pile.', 'Baraja tu mazo y ponlo en tu mazo de robo.'])}</li>
        </ol>
      </Card>
      <Next label={useNextLabel()} onClick={() => move(G.toFirst)} />
    </>
  );
}

export function FirstScreen({ g, move }: ScreenProps) {
  const t = useT();
  const name = useNames(g);
  const [flipping, setFlipping] = useState(false);
  const flip = () => {
    move((s) => G.drawFirst(s, Math.random));
    setFlipping(true);
    setTimeout(() => setFlipping(false), motionMs(1750));
  };
  return (
    <>
      <h1>{t(['Who goes first?', '¿Quién empieza?'])}</h1>
      <Coin faces={[name(0), name(1)]} face={g.first} flipping={flipping} />
      {g.first === null && <Next label={t(['Flip the coin', 'Lanzar la moneda'])} onClick={flip} />}
      {g.first !== null && !flipping && (
        <>
          <p className="big winner">{t([`${name(g.first)} goes first`, `Empieza ${name(g.first)}`])}</p>
          <Next label={t(['Start round 1', 'Empezar la ronda 1'])} onClick={() => move(G.beginRound)} />
        </>
      )}
    </>
  );
}

// ---------- a round ----------

/** One candle per life that can be lost; `snuff` plays the candle that just went out. */
function Lives({ g, snuff }: { g: Game; snuff?: Player }) {
  const name = useNames(g);
  const t = useT();
  const candles = G.livesTotal(g) - 1;
  return (
    <div className="lives">
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

function CarryLine({ c }: { c: Carry }) {
  const t = useT();
  if (c.kind === 'boon') {
    const b = BOON_TEXT[c.id];
    return <li className="carry"><b>{t(b.name)}.</b> {t(b.text)}</li>;
  }
  if (c.kind === 'aquasquirrels') {
    return <li className="carry"><b>{t(['Aquasquirrels.', 'Acuardillas.'])}</b> {t(['All your Squirrels are replaced by Aquasquirrels this round. On your adversary’s turn, turn them face down.', 'Esta ronda, todas tus Ardillas se cambian por Acuardillas. En el turno de tu adversario, ponlas boca abajo.'])}</li>;
  }
  const stone = sigilByKey(c.stone);
  return <li className="carry"><b>{t(['Totem', 'Tótem'])}: {t(HEAD_NAMES[c.head])} + {stone ? t(stone.name) : c.stone}.</b> {t(['Every card of that tribe on your side has that sigil this round.', 'Todas las cartas de esa tribu de tu lado tienen ese sello esta ronda.'])}{c.head === 'squirrels' ? ` ${t(['It applies to your Squirrels, Aquasquirrels and the Squirrel Ball.', 'Afecta a tus Ardillas, Acuardillas y a la Bola de ardillas.'])}` : ''}</li>;
}

function ProspectorPanel({ g, move }: ScreenProps) {
  const t = useT();
  const name = useNames(g);
  const icon = 'nodes/bossnode_prospector';
  if (!g.prospector) {
    return (
      <Card title={t(['The Prospector’s round', 'La ronda del Buscador de oro'])} icon={icon}>
        <ProspectorBoard names={[name(G.other(g.loser!)), name(g.loser!)]} awake={false} />
        <ul className="steps">
          <li>{t([`Start with the Pack Mule in ${name(g.loser!)}’s leftmost space.`, `Empieza con la Mula de carga en el espacio de más a la izquierda de ${name(g.loser!)}.`])}</li>
          <li>{t(['It has no owner: it doesn’t attack, can’t be sacrificed, and blocks that column for that side.', 'No es de nadie: no ataca, no se puede sacrificar y bloquea esa columna para ese lado.'])}</li>
          <li>{t(['At the end of each turn, that turn’s player must move it one space, beside it or across from it, if an empty one is there.', 'Al final de cada turno, el jugador del turno debe moverla un espacio, a su lado o enfrente, si hay uno vacío.'])}</li>
          <li>{t(['Whoever kills it in combat takes a Squirrel, a common and a rare from the leftover pile, and wakes the Prospector. Items can’t touch it.', 'Quien la mate en combate se lleva una Ardilla, una común y una rara del montón sobrante, y despierta al Buscador de oro. Los objetos no le afectan.'])}</li>
        </ul>
        <p className="prompt">{t(['Who killed the mule?', '¿Quién ha matado a la mula?'])}</p>
        <div className="row">
          {([0, 1] as const).map((p) => <button key={p} type="button" onClick={() => move((s) => G.wakeProspector(s, p))}>{name(p)}</button>)}
        </div>
      </Card>
    );
  }
  const stepText = [
    { title: t(['He waits.', 'Espera.']), text: t(['Nothing happens at the end of this turn.', 'Al final de este turno no pasa nada.']) },
    { title: t(['He marks.', 'Marca.']), text: t([`At the end of this turn, put a token on the strongest card on either side: highest power with buffs, then highest health, then ${name(g.prospector.waker)} chooses.`, `Al final de este turno, pon una ficha en la carta más fuerte de cualquier lado: más poder con sus mejoras, luego más vida, luego elige ${name(g.prospector.waker)}.`]) },
    { title: t(['He strikes!', '¡Golpea!']), text: t(['At the end of this turn, the marked card dies (its owner gets the bone) and a Gold Nugget (2 health) takes its space. If it already left the board, he misses.', 'Al final de este turno, la carta marcada muere (su dueño recibe el hueso) y una Pepita de oro (2 de vida) ocupa su espacio. Si ya salió del tablero, falla.']) },
  ][g.prospector.step];
  return (
    <Card title={t(['The Prospector is awake', 'El Buscador de oro está despierto'])} icon={icon} active>
      <ProspectorBoard names={[name(G.other(g.loser!)), name(g.loser!)]} awake />
      <p className="big">{stepText.title}</p>
      <p>{stepText.text}</p>
      <p className="muted">{t(['With 4 Gold Nuggets on the board, he doesn’t strike.', 'Con 4 Pepitas de oro en el tablero, no golpea.'])}</p>
      <button type="button" className="wide" onClick={() => move(G.prospectorTurn)}>{t(['Turn ended', 'Turno terminado'])}</button>
    </Card>
  );
}

/** The complicated cards in this game: each opens its page, with its tutorial. */
function TrickyCards({ g }: { g: Game }) {
  const t = useT();
  const open = useContext(CardSheetContext);
  const list = TRICKY_CARDS.flatMap((id) => {
    const group = GROUPS.find((x) => x.cards.some((c) => c.id === id));
    const inGame = group && (!group.id.startsWith('kaycee:') || g.kaycee) && (!group.id.startsWith('pelts:') || g.pelts);
    return inGame ? [group.cards.find((c) => c.id === id)!] : [];
  });
  return (
    <details className="reminders">
      <summary>{t(['Cards with tricks', 'Cartas con truco'])}</summary>
      <div className="tricky-list">
        {list.map((c) => <button key={c.id} type="button" onClick={() => open(c.id)}>{t(c.name)}</button>)}
      </div>
    </details>
  );
}

export function RoundScreen({ g, move }: ScreenProps) {
  const t = useT();
  const name = useNames(g);
  const freshDraw = g.kaycee || g.round === 1;
  const always = [...ALWAYS, ...(g.kaycee ? ALWAYS_KAYCEE : ALWAYS_BASE)];
  const wide = useMedia('(min-width: 900px)');
  return (
    <>
      <h1>{t([`Round ${g.round}`, `Ronda ${g.round}`])} <small>{t([`of up to ${G.maxRounds(g)}`, `de ${G.maxRounds(g)} como máximo`])}</small></h1>
      <Lives g={g} />
      {g.first !== null && <p className="big">{t([`${name(g.first)} goes first`, `Empieza ${name(g.first)}`])}</p>}

      <h2>{t(['At the start of the round', 'Al empezar la ronda'])}</h2>
      <div className="two-col">
      {([0, 1] as const).map((p) => {
        const carried = G.carriedNow(g, p);
        return (
          <Card key={p} title={name(p)}>
            <ul className="steps">
              {freshDraw
                ? <li>{t(['Shuffle your deck, then draw 3 cards and 1 Squirrel.', 'Baraja tu mazo y roba 3 cartas y 1 Ardilla.'])}</li>
                : <li>{t(['You already have your hand: you drew when the last round ended.', 'Ya tienes tu mano: robaste al acabar la ronda anterior.'])}</li>}
              {carried.map((c, i) => <CarryLine key={i} c={c} />)}
              {g.lost[p] > 0 && <li>{t(['If you still hold a Smoke, it stays in your hand until you play it.', 'Si aún tienes un Humo, se queda en tu mano hasta que lo juegues.'])}</li>}
            </ul>
          </Card>
        );
      })}
      </div>
      {g.kaycee && <p className="muted note">{t(['Ijiraq in a deck: take it out before shuffling; the other player slips it back in, face up, wherever they like.', 'Ijiraq en un mazo: sácalo antes de barajar; el otro jugador lo mete de nuevo, boca arriba, donde quiera.'])}</p>}

      {G.isProspectorRound(g) && <ProspectorPanel g={g} move={move} />}

      <TrickyCards g={g} />
      <details className="reminders">
        <summary>{t(['Show the board', 'Ver el tablero'])}</summary>
        <ExampleBoard names={[name(0), name(1)]} />
      </details>
      <div className="two-col">
      <details className="reminders" open={wide}>
        <summary>{t(['Reminder: a turn', 'Recordatorio: un turno'])}</summary>
        <ol className="steps">{TURN_STEPS.map((s) => <li key={s.title[0]}><b>{t(s.title)}.</b> {t(s.text)}</li>)}</ol>
      </details>
      <details className="reminders" open={wide}>
        <summary>{t(['Reminder: this round', 'Recordatorio: esta ronda'])}</summary>
        <Steps items={always} />
      </details>
      </div>
      {g.kaycee && <D20 />}

      <h2>{t(['Who lost a life?', '¿Quién ha perdido una vida?'])}</h2>
      <p className="muted note">{t(['The scale reached 5 against them. Tap it when the round ends.', 'La balanza ha llegado a 5 en su contra. Púlsalo cuando acabe la ronda.'])}</p>
      <div className="row">
        {([0, 1] as const).map((p) => <button key={p} type="button" className="danger" onClick={() => move((s) => G.loseLife(s, p))}>{name(p)}</button>)}
      </div>
    </>
  );
}

/** The room dims for a moment when a life is lost. It leaves once it has played. */
function Dim() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setOn(false), 1500);
    return () => clearTimeout(id);
  }, []);
  return on ? <div className="dim" /> : null;
}

/** A life lost, in a base game. */
export function DeathScreen({ g, move }: ScreenProps) {
  const t = useT();
  const name = useNames(g);
  const loser = g.loser!;
  return (
    <>
      <Dim />
      <h1>{t(['End of the round', 'Fin de la ronda'])}</h1>
      <Lives g={g} snuff={loser} />
      <Card title={t(['Both players', 'Los dos jugadores'])}>
        <ol className="steps">
          <li>{t(['Keep your hand and all your bones.', 'Conserva tu mano y todos tus huesos.'])}</li>
          <li>{t(['Cards on the board go to the dead pile: no bones, and Unkillable cards don’t return. Swap cards go to the swaps pile.', 'Las cartas del tablero van a la pila de muertos: sin huesos, y las Inmatables no vuelven. Las de intercambio, a su montón.'])}</li>
          <li>{t(['Shuffle your dead pile back into your deck.', 'Baraja tu pila de muertos en tu mazo.'])}</li>
          <li>{t(['Draw 3 more cards and 1 Squirrel.', 'Roba 3 cartas más y 1 Ardilla.'])}</li>
        </ol>
      </Card>
      <Card title={name(loser)} active>
        <ul className="steps">
          <li>{t(['Put out your candle.', 'Apaga tu vela.'])}</li>
          <li>{t(['Take the Greater Smoke from the Smoke pile.', 'Coge el Humo superior del montón de Humo.'])}</li>
        </ul>
      </Card>
      <p className="muted note">{t(['The scale goes back to 0.', 'La balanza vuelve a 0.'])}</p>
      <Next label={t([`Start round ${g.round + 1}`, `Empezar la ronda ${g.round + 1}`])} onClick={() => move(G.finishDeath)} />
    </>
  );
}

// ---------- a Kaycee's Mod break ----------

const BREAK_STEPS = [['Fresh start', 'De cero'], ['Card draft', 'Reparto'], ['Upgrades', 'Mejoras'], ['Challenges', 'Desafíos']] as const;

function BreakProgress({ g, at }: { g: Game; at: number }) {
  const t = useT();
  const steps = BREAK_STEPS.map((s, i) => (i === 3 && g.round === 3 ? (['The Limoncello', 'El Limoncello'] as const) : s));
  return (
    <ol className="progress" aria-label={t(['Between rounds', 'Entre rondas'])}>
      {steps.map((s, i) => <li key={s[0]} className={i === at ? 'now' : i < at ? 'done' : ''}>{t(s)}</li>)}
    </ol>
  );
}

function BreakHead({ g, at }: { g: Game; at: number }) {
  const t = useT();
  return (
    <>
      <p className="eyebrow">{t([`After round ${g.round}`, `Tras la ronda ${g.round}`])}</p>
      <BreakProgress g={g} at={at} />
    </>
  );
}

export function FreshScreen({ g, move }: ScreenProps) {
  const t = useT();
  const name = useNames(g);
  const loser = g.loser!;
  const smoke = G.smokeFor(g.lost[loser]);
  return (
    <>
      <BreakHead g={g} at={0} />
      <Dim />
      <h1>{t(['A fresh start', 'Cada ronda empieza de cero'])}</h1>
      <Lives g={g} snuff={loser} />
      <div className="two-col">
      <Card title={name(loser)} active>
        <ul className="steps">
          <li>{t(['Put out a candle.', 'Apaga una vela.'])}</li>
          <li>{smoke === 'greater'
            ? t(['Take the Greater Smoke. You may keep it in hand and play it in a later round.', 'Coge el Humo superior. Puedes guardarlo en la mano y jugarlo en una ronda posterior.'])
            : t(['Take a normal Smoke from the Smoke pile.', 'Coge un Humo normal del montón de Humo.'])}</li>
        </ul>
      </Card>
      <Card title={t(['Both players', 'Los dos jugadores'])}>
        <ol className="steps">
          <li>{t(['Cards on the board go to the dead pile (swap cards to the swaps pile).', 'Las cartas del tablero van a la pila de muertos (las de intercambio a su montón).'])}</li>
          <li>{t(['Shuffle your dead pile and your hand into your deck. Squirrels go back to their pile and swap cards to theirs. Only the Smoke and your items stay in your hand.', 'Baraja en tu mazo tu pila de muertos y tu mano. Las Ardillas vuelven a su montón y las de intercambio al suyo. En tu mano solo se quedan el Humo y tus objetos.'])}</li>
          <li>{g.pelts
            ? t(['Move your unused bones to your bank. Damage past 5 on the blow that took the life goes to the bank of the player who dealt it, as bones.', 'Pasa tus huesos sin usar a tu banco. El daño que pasó de 5 en el golpe que quitó la vida va al banco de quien lo hizo, en huesos.'])
            : t(['Your unused bones are lost.', 'Tus huesos sin usar se pierden.'])}</li>
          <li>{t(['The scale goes back to 0.', 'La balanza vuelve a 0.'])}</li>
        </ol>
      </Card>
      </div>
      <Next label={useNextLabel()} onClick={() => move(G.toCardDraft)} />
    </>
  );
}

export function CardDraftScreen({ g, move }: ScreenProps) {
  const t = useT();
  const name = useNames(g);
  const a = g.loser!;
  const b = G.other(a);
  return (
    <>
      <BreakHead g={g} at={1} />
      <h1>{t(['The card draft', 'El reparto de cartas'])}</h1>
      <Card icon="nodes/cardchoicenode" title={t(['Reveal 6 common cards from the leftover pile', 'Destapa 6 cartas comunes del montón sobrante'])}>
        <ol className="steps">
          <li>{t([`${name(a)} picks one.`, `${name(a)} elige una.`])}</li>
          <li>{t([`${name(b)} picks two.`, `${name(b)} elige dos.`])}</li>
          <li>{t([`${name(a)} picks one.`, `${name(a)} elige una.`])}</li>
          <li>{t(['The 2 left go back. Your cards join your deck.', 'Las 2 que quedan vuelven. Tus cartas pasan a tu mazo.'])}</li>
        </ol>
      </Card>
      <Next label={useNextLabel()} onClick={() => move((s) => G.toUpgrades(s, Math.random))} />
    </>
  );
}

export function PickScreen({ g, move }: ScreenProps) {
  const t = useT();
  const name = useNames(g);
  if (g.phase.kind !== 'pick') return null;
  const { group, tokens, picks } = g.phase;
  const chooser = picks.length < 2 ? G.turnPlayer(g, picks.length as 0 | 1) : null;
  const upgrade = group === 'upgrade';
  return (
    <>
      <BreakHead g={g} at={upgrade ? 2 : 3} />
      <h1>{upgrade ? t(['Upgrades', 'Mejoras']) : t(['Challenges', 'Desafíos'])}</h1>
      <p className="lead">{upgrade
        ? t(['These 3 came up at random. They’re safe.', 'Han salido estas 3 al azar. Son seguras.'])
        : t(['These can be lost.', 'Estos se pueden perder.'])}</p>
      <p className="prompt">{chooser === null
        ? t(['Both have chosen. Confirm, or go back to change it.', 'Ya habéis elegido. Confirmad, o volved atrás para cambiarlo.'])
        : t([`${name(chooser)} chooses`, `Elige ${name(chooser)}`])}</p>
      <div className="choices pick-list">
        {tokens.map((token, i) => {
          const taken = picks.indexOf(token);
          const e = EVENTS[token];
          return (
            <Choice
              key={token}
              token={<EventToken icon={`nodes/${e.icon}`} group={group} i={i} />}
              title={t(e.name)}
              text={t(e.text)}
              disabled={taken >= 0 || chooser === null}
              selected={taken >= 0}
              note={taken >= 0 ? name(G.turnPlayer(g, taken as 0 | 1)) : undefined}
              onClick={() => move((s) => G.pickToken(s, token))}
            />
          );
        })}
      </div>
      <div className="row pick-actions">
        <button type="button" disabled={!picks.length} onClick={() => move(G.unpickToken)}>{t(['Back', 'Atrás'])}</button>
        <button type="button" className="primary" disabled={chooser !== null} onClick={() => move((s) => G.confirmPicks(s, Math.random))}>{t(['Confirm', 'Confirmar'])}</button>
      </div>
    </>
  );
}

function TrialResult({ move }: { move: Move }) {
  const t = useT();
  return (
    <div className="row">
      <button type="button" className="ok" onClick={() => move((s) => G.trialResult(s, true, Math.random))}>{t(['Passed', 'Superada'])}</button>
      <button type="button" className="danger" onClick={() => move((s) => G.trialResult(s, false, Math.random))}>{t(['Failed', 'Fallada'])}</button>
    </div>
  );
}

/** What each event asks of the helper beyond its text. */
function EventDetails({ token, a, move }: { token: Token; a: Activity; move: Move }) {
  const t = useT();
  if (token === 'campfire') return <D20 hint={['1 to 5: the card is eaten and leaves the game.', 'Del 1 al 5: se comen la carta y sale de la partida.']} />;
  if (token === 'totem') {
    return (
      <>
        <p className="prompt">{t(['Choose a tribe', 'Elige una tribu'])}</p>
        <div className="choices">
          {a.options!.map((h, i) => <Choice key={h} i={i} icon={HEAD_ICONS[h]} title={t(HEAD_NAMES[h])} selected={a.chosen === h} onClick={() => move((s) => G.chooseOption(s, h))} />)}
        </div>
        <p className="prompt">{t(['Choose a sigil', 'Elige un sello'])}</p>
        <div className="choices">
          {a.stones!.map((k, i) => {
            const s = sigilByKey(k);
            return <Choice key={k} i={i + 3} icon={s?.icon} title={s ? t(s.name) : k} text={s && t(s.text)} selected={a.stone === k} onClick={() => move((g) => G.chooseStone(g, k))} />;
          })}
        </div>
      </>
    );
  }
  if (token === 'leshy') {
    return (
      <>
        {a.passed === undefined && <TrialChoice a={a} move={move} />}
        {a.chosen && a.passed === undefined && <TrialResult move={move} />}
        {a.passed === true && <p className="result ok-text">{t(['Passed! Shuffle the rares of the leftover pile face down, reveal 3 and take one into your deck.', '¡Superada! Baraja boca abajo las raras del montón sobrante, destapa 3 y quédate una en tu mazo.'])}</p>}
        {a.passed === false && <p className="result bad-text">{t(['Failed: for the next round, all your Squirrels are replaced by Aquasquirrels. The helper will remind you.', 'Fallada: en la siguiente ronda, todas tus Ardillas se cambian por Acuardillas. La ayuda te lo recordará.'])}</p>}
      </>
    );
  }
  if (token === 'deck') {
    return (
      <>
        {a.passed === undefined && <TrialChoice a={a} move={move} />}
        {a.chosen && a.passed === undefined && <TrialResult move={move} />}
        {a.passed === false && <p className="result">{t(['Failed: it costs nothing.', 'Fallada: no cuesta nada.'])}</p>}
        {a.passed === true && (
          <>
            <p className="prompt">{t(['Passed! Choose a boon for the next round', '¡Superada! Elige una bendición para la siguiente ronda'])}</p>
            <div className="choices">
              {a.options!.map((b, i) => <Choice key={b} i={i} icon={`trials/${BOON_TEXT[b].icon}`} title={t(BOON_TEXT[b].name)} text={t(BOON_TEXT[b].text)} selected={a.boon === b} onClick={() => move((s) => G.chooseBoon(s, b))} />)}
            </div>
          </>
        )}
      </>
    );
  }
  if (token === 'altar') {
    if (!a.offering) {
      return (
        <>
          <p className="prompt">{t(['What did you sacrifice?', '¿Qué has sacrificado?'])}</p>
          <div className="choices">
            <Choice title={t(['A rare or a death card', 'Una carta rara o de muerte'])} text={t(['It pleases him: the Bone Lord boon.', 'Le complace: la bendición del Señor de los huesos.'])} onClick={() => move((s) => G.offer(s, 'rare', Math.random))} />
            <Choice title={t(['Any other card', 'Cualquier otra carta'])} text={t(['Roll the d20: 1–5 nothing, 6–15 Lesser Bone Lord, 16–20 Bone Lord.', 'Tira el d20: 1–5 nada, 6–15 Señor de los huesos menor, 16–20 Señor de los huesos.'])} onClick={() => move((s) => G.offer(s, 'other', Math.random))} />
          </div>
        </>
      );
    }
    return <AltarResult a={a} />;
  }
  return null;
}

/** The altar's answer, once the die has landed. */
function AltarResult({ a }: { a: Activity }) {
  const t = useT();
  const landed = useSettled(a.roll === undefined ? 0 : 1050);
  const boon = G.altarBoon(a);
  return (
    <>
      {a.roll !== undefined && <div className="die-big"><Die value={a.roll} rollKey="altar" /></div>}
      {landed && (boon
        ? <p className="result ok-text"><b>{t(BOON_TEXT[boon].name)}.</b> {t(BOON_TEXT[boon].text)} {t(['The helper will remind you.', 'La ayuda te lo recordará.'])}</p>
        : <p className="result">{t(['He scorns it: you get nothing.', 'La desprecia: no recibes nada.'])}</p>)}
    </>
  );
}

function TrialChoice({ a, move }: { a: Activity; move: Move }) {
  const t = useT();
  return (
    <>
      <p className="prompt">{t(['Choose a trial', 'Elige una prueba'])}</p>
      <div className="choices">
        {a.options!.map((id, i) => <Choice key={id} i={i} icon={`trials/${TRIALS[id].icon}`} title={t(TRIALS[id].name)} text={t(TRIALS[id].text)} selected={a.chosen === id} onClick={() => move((s) => G.chooseOption(s, id))} />)}
      </div>
    </>
  );
}

export function PlayScreen({ g, move }: ScreenProps) {
  const t = useT();
  const name = useNames(g);
  if (g.phase.kind !== 'play') return null;
  const { group, picks, turn, activity } = g.phase;
  const token = picks[turn];
  const e = EVENTS[token];
  const later = EVENTS[picks[1]];
  return (
    <>
      <BreakHead g={g} at={group === 'upgrade' ? 2 : 3} />
      <h1>{t([`${name(G.turnPlayer(g, turn))}’s turn`, `Turno de ${name(G.turnPlayer(g, turn))}`])}</h1>
      <Card title={t(e.name)} icon={`nodes/${e.icon}`} active>
        <p>{t(e.text)}</p>
        <EventDetails token={token} a={activity} move={move} />
      </Card>
      {turn === 0 && <p className="muted note">{t([`Then ${name(G.turnPlayer(g, 1))}: ${later.name[0]}.`, `Después ${name(G.turnPlayer(g, 1))}: ${later.name[1]}.`])}</p>}
      <Next label={t(['Done', 'Hecho'])} disabled={!G.canFinish(g)} onClick={() => move((s) => G.finishEvent(s, Math.random))} />
    </>
  );
}

export function LimoncelloScreen({ g, move }: ScreenProps) {
  const t = useT();
  const name = useNames(g);
  const a = g.loser!;
  const b = G.other(a);
  return (
    <>
      <BreakHead g={g} at={3} />
      <h1>{t(['The Limoncello', 'El Limoncello'])}</h1>
      <p className="lead">{t(['A boss fight you play together. It costs no lives.', 'Un combate contra un jefe que jugáis juntos. No cuesta vidas.'])}</p>
      <LimoncelloBoard names={[name(a), name(b)]} />
      <div className="two-col">
      <Card title={t(['Setup', 'Preparación'])} icon="nodes/bossnode_royal">
        <ul className="steps">
          <li>{t(['The ship is two cards side by side, in the middle of one row. You share the other row.', 'El barco son dos cartas juntas, en el centro de una fila. Compartís la otra fila.'])}</li>
          <li>{t(['Each player: your deck, 10 Squirrels, Smoke and items; draw 3 cards and 1 Squirrel, with no bones.', 'Cada jugador: tu mazo, 10 Ardillas, Humo y objetos; roba 3 cartas y 1 Ardilla, sin huesos.'])}</li>
          <li>{t(['Each player has a tooth (any token will do). Both start at 0; the ship’s hits move a tooth towards its owner’s end.', 'Cada jugador tiene un diente (sirve cualquier ficha). Empiezan en 0; los golpes del barco mueven el diente hacia el extremo de su dueño.'])}</li>
        </ul>
      </Card>
      <Card title={t(['Turn order', 'Orden de turnos'])}>
        <ol className="steps">
          <li><b>{name(a)}</b> · {t(['the two left columns', 'las dos columnas de la izquierda'])}</li>
          <li><b>{name(b)}</b> · {t(['the two right columns', 'las dos columnas de la derecha'])}</li>
          <li>{t(['The ship fires its Broadside at the 2 spaces across and sails one space, turning around at the edge.', 'El barco dispara su Andanada a los 2 espacios de enfrente y navega un espacio, dando la vuelta en el borde.'])}</li>
        </ol>
      </Card>
      </div>
      <Card title={t(['Reminders', 'Recordatorios'])}>
        <ul className="steps">
          <li>{t(['Play in any space of your row, but a hit on an empty space goes to that column’s player.', 'Juega en cualquier espacio de vuestra fila, pero un golpe a un espacio vacío va al jugador de esa columna.'])}</li>
          <li>{t(['Your strikes only hit when the ship is across; each strike that lands counts (Bifurcated and Trifurcated can hit twice). Flyers are stopped by its Mighty Leap.', 'Tus golpes solo aciertan si el barco está enfrente; cada golpe que cae cuenta (bifurcado y trifurcado pueden golpear dos veces). Su Salto poderoso detiene a los voladores.'])}</li>
          <li>{t(['A tooth at 5: that player is out. They stop drawing and playing, but their cards stay and attack on their turn. The other player takes every empty column’s hits.', 'Un diente en 5: ese jugador queda fuera. Ya no roba ni juega, pero sus cartas se quedan y atacan en su turno. El otro recibe los golpes de todas las columnas vacías.'])}</li>
          <li>{t(['Scissors, Skinning Knife, Fish Hook, Wiseclock and Magickal Bleach do nothing to the ship.', 'Tijeras, Cuchillo de desollar, Anzuelo, Reloj mecánico y Lejía mágica no le hacen nada al barco.'])}</li>
          <li>{t(['From half health (20): after it sails, a crew card (shuffled face down) appears in an empty space across from it, for that column’s player.', 'Desde la mitad de su vida (20): después de navegar, una carta de la tripulación (barajada boca abajo) aparece en un espacio vacío de enfrente, para el jugador de esa columna.'])}</li>
          <li>{t(['Once both players are out of Squirrels, the ship gains 1 power each turn.', 'Cuando a los dos se os acaben las Ardillas, el barco gana 1 de poder cada turno.'])}</li>
        </ul>
      </Card>
      <Next label={t(['The fight is over', 'El combate ha terminado'])} onClick={() => move(G.toLimoncelloEnd)} />
    </>
  );
}

export function LimoncelloEndScreen({ g, move }: ScreenProps) {
  const t = useT();
  const name = useNames(g);
  if (g.phase.kind !== 'limoncelloEnd') return null;
  const { result } = g.phase;
  return (
    <>
      <BreakHead g={g} at={3} />
      <h1>{t(['How did it end?', '¿Cómo ha acabado?'])}</h1>
      <div className="choices">
        <Choice title={t(['Sunk, both still in', 'Hundido, los dos seguís'])} selected={result === 'both'} onClick={() => move((s) => G.limoncelloResult(s, 'both'))} />
        <Choice title={t(['Sunk, one player left', 'Hundido, queda un jugador'])} selected={result === 'one'} onClick={() => move((s) => G.limoncelloResult(s, 'one'))} />
        <Choice title={t(['You lost', 'Habéis perdido'])} selected={result === 'none'} onClick={() => move((s) => G.limoncelloResult(s, 'none'))} />
      </div>
      {result && (
        <Card title={t(['Rewards and clean-up', 'Recompensas y recogida'])} active>
          <ul className="steps">
            {result === 'both' && <li>{t([`Reveal 3 rares from the leftover pile. ${name(g.loser!)} picks one, then ${name(G.other(g.loser!))}.`, `Destapa 3 raras del montón sobrante. ${name(g.loser!)} elige una, después ${name(G.other(g.loser!))}.`])}</li>}
            {result === 'one' && <li>{t(['Reveal 3 rares from the leftover pile. The player left takes two of them.', 'Destapa 3 raras del montón sobrante. El jugador que queda se lleva dos.'])}</li>}
            {result === 'none' && <li>{t(['No reward, and it costs nothing.', 'Sin recompensa, y no cuesta nada.'])}</li>}
            <li>{t(['All cards go back to their decks, hands too. The crew goes to the swaps pile.', 'Todas las cartas vuelven a sus mazos, también las de la mano. La tripulación, al montón de intercambios.'])}</li>
            <li>{t(['Bones left over are lost, even with the bank.', 'Los huesos que sobren se pierden, también con el banco.'])}</li>
          </ul>
        </Card>
      )}
      <Next label={t([`Start round ${g.round + 1}`, `Empezar la ronda ${g.round + 1}`])} disabled={!result} onClick={() => move(G.finishLimoncello)} />
    </>
  );
}

export function OverScreen({ g, onNew }: ScreenProps & { onNew: () => void }) {
  const t = useT();
  const name = useNames(g);
  if (g.phase.kind !== 'over') return null;
  const { winner } = g.phase;
  return (
    <>
      <h1>{t([`${name(winner)} wins!`, `¡Gana ${name(winner)}!`])}</h1>
      <Lives g={g} />
      <Card title={t([`${name(G.other(winner))} makes a death card`, `${name(G.other(winner))} hace una carta de muerte`])} icon="nodes/bossnode_leshy">
        <ol className="steps">{DEATH_CARD_STEPS.map((s) => <li key={s[0]}>{t(s)}</li>)}</ol>
      </Card>
      <Next label={t(['New game', 'Nueva partida'])} onClick={onNew} />
    </>
  );
}
