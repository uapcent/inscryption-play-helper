/** A round, and the end of a round in a base game. */
import { useContext, useState } from 'react';
import { ExampleBoard, ProspectorBoard } from '../Board';
import { GROUPS } from '../CardSheet';
import { ScaleCounter } from '../ScaleCounter';
import { sigilByKey } from '../Sigils';
import { ALWAYS, ALWAYS_BASE, ALWAYS_KAYCEE, BOON_TEXT, HEAD_NAMES, TURN_STEPS } from '../content';
import * as G from '../game';
import type { Carry, Game } from '../game';
import { TRICKY_CARDS } from '../notes';
import { CardSheetContext, Card, D20, Steps, useMedia, useT } from '../ui';
import { useNames, Next, Lives, Dim } from './shared';
import type { ScreenProps } from './shared';

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
        <details className="fold">
          <summary>{t(['How the mule works', 'Cómo funciona la mula'])}</summary>
          <ProspectorBoard names={[name(G.other(g.loser!)), name(g.loser!)]} awake={false} />
          <ul className="steps">
          <li>{t(['It has no owner: it doesn’t attack, can’t be sacrificed, and blocks that column for that side.', 'No es de nadie: no ataca, no se puede sacrificar y bloquea esa columna para ese lado.'])}</li>
          <li>{t(['At the end of each turn, that turn’s player must move it one space, beside it or across from it, if an empty one is there.', 'Al final de cada turno, el jugador del turno debe moverla un espacio, a su lado o enfrente, si hay uno vacío.'])}</li>
          <li>{t(['Whoever kills it in combat takes a Squirrel, a common and a rare from the leftover pile, and wakes the Prospector. Items can’t touch it.', 'Quien la mate en combate se lleva una Ardilla, una común y una rara del montón sobrante, y despierta al Buscador de oro. Los objetos no le afectan.'])}</li>
          </ul>
        </details>
        <p>{t([`The Pack Mule starts in ${name(g.loser!)}’s leftmost space. Each turn’s player moves it one space at the end of their turn.`, `La Mula de carga empieza en el espacio de más a la izquierda de ${name(g.loser!)}. El jugador de cada turno la mueve un espacio al acabar su turno.`])}</p>
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
      <p className="big">{stepText.title}</p>
      <p>{stepText.text}</p>
      <p className="muted">{t(['With 4 Gold Nuggets on the board, he doesn’t strike.', 'Con 4 Pepitas de oro en el tablero, no golpea.'])}</p>
      <button type="button" className="wide" onClick={() => move(G.prospectorTurn)}>{t(['Turn ended', 'Turno terminado'])}</button>
      <details className="fold">
        <summary>{t(['The board', 'El tablero'])}</summary>
        <ProspectorBoard names={[name(G.other(g.loser!)), name(g.loser!)]} awake />
      </details>
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

/**
 * A round, laid out for a phone on the table: what the players need stays in view (lives, the
 * scale, this round's effects, the Prospector); the start-of-round steps fold away once
 * everyone is ready, and the rules and tools wait in one menu.
 */
export function RoundScreen({ g, move }: ScreenProps) {
  const t = useT();
  const name = useNames(g);
  const freshDraw = g.kaycee || g.round === 1;
  const always = [...ALWAYS, ...(g.kaycee ? ALWAYS_KAYCEE : ALWAYS_BASE)];
  const wide = useMedia('(min-width: 900px)');
  const [starting, setStarting] = useState(true);
  const carried = ([0, 1] as const).map((p) => G.carriedNow(g, p));
  const smoke = ([0, 1] as const).filter((p) => g.lost[p] > 0);
  return (
    <>
      <h1 className="round-title">{t([`Round ${g.round}`, `Ronda ${g.round}`])} <small>{t([`of up to ${G.maxRounds(g)}`, `de ${G.maxRounds(g)} como máximo`])}</small></h1>
      <Lives g={g} compact />
      <ScaleCounter g={g} move={move} names={[name(0), name(1)]} />

      <details className="reminders start-round" open={starting} onToggle={(e) => setStarting(e.currentTarget.open)}>
        <summary>
          {t(['Start of the round', 'Al empezar la ronda'])}
          {!starting && g.first !== null && <span className="summary-note">{t([` · ${name(g.first)} goes first`, ` · empieza ${name(g.first)}`])}</span>}
        </summary>
        <div className="start-body">
          {g.first !== null && <p className="big">{t([`${name(g.first)} goes first`, `Empieza ${name(g.first)}`])}</p>}
          <ul className="steps">
            {freshDraw
              ? <li>{t(['Each player: shuffle your deck, then draw 3 cards and 1 Squirrel.', 'Cada jugador: baraja tu mazo y roba 3 cartas y 1 Ardilla.'])}</li>
              : <li>{t(['You already have your hands: you drew when the last round ended.', 'Ya tenéis vuestras manos: robasteis al acabar la ronda anterior.'])}</li>}
            {smoke.length > 0 && <li>{t([`${smoke.map(name).join(' and ')}: a Smoke you still hold stays in your hand until you play it.`, `${smoke.map(name).join(' y ')}: el Humo que aún tengas se queda en tu mano hasta que lo juegues.`])}</li>}
            {g.kaycee && <li>{t(['Ijiraq in a deck: take it out before shuffling; the other player slips it back in, face up, wherever they like.', 'Ijiraq en un mazo: sácalo antes de barajar; el otro jugador lo mete de nuevo, boca arriba, donde quiera.'])}</li>}
          </ul>
          <button type="button" className="primary wide" onClick={() => setStarting(false)}>{t(['Ready: play', 'Listos: a jugar'])}</button>
        </div>
      </details>

      {carried.some((c) => c.length > 0) && (
        <Card title={t(['This round', 'Esta ronda'])}>
          {([0, 1] as const).map((p) => carried[p].length > 0 && (
            <div key={p} className="carried">
              <b className="carried-name">{name(p)}</b>
              <ul className="steps">{carried[p].map((c, i) => <CarryLine key={i} c={c} />)}</ul>
            </div>
          ))}
        </Card>
      )}

      {G.isProspectorRound(g) && <ProspectorPanel g={g} move={move} />}

      <details className="reminders tools" open={wide}>
        <summary>{t(['Rules and tools', 'Reglas y herramientas'])}</summary>
        <div className="tools-body">
          {g.kaycee && <D20 />}
          <TrickyCards g={g} />
          <details className="reminders">
            <summary>{t(['The board', 'El tablero'])}</summary>
            <ExampleBoard names={[name(0), name(1)]} />
          </details>
          <details className="reminders" open={wide}>
            <summary>{t(['A turn', 'Un turno'])}</summary>
            <ol className="steps">{TURN_STEPS.map((s) => <li key={s.title[0]}><b>{t(s.title)}.</b> {t(s.text)}</li>)}</ol>
          </details>
          <details className="reminders" open={wide}>
            <summary>{t(['This round’s rules', 'Las reglas de esta ronda'])}</summary>
            <Steps items={always} />
          </details>
          <div className="lost-by-hand">
            <p className="muted note">{t(['Keeping the scale on the table instead? When it reaches 5 against a player, tap who lost a life.', '¿Lleváis la balanza en la mesa? Cuando llegue a 5 en contra de un jugador, pulsad quién ha perdido una vida.'])}</p>
            <div className="row">
              {([0, 1] as const).map((p) => <button key={p} type="button" className="danger" onClick={() => move((s) => G.loseLife(s, p))}>{name(p)}</button>)}
            </div>
          </div>
        </div>
      </details>
    </>
  );
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
