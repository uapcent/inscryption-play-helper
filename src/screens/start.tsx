/** Before the first round: setup, the cards, preparing the table, the draft, who goes first. */
import { useState } from 'react';
import { BoardTour } from '../Board';
import { CardsView } from '../CardsView';
import * as G from '../game';
import type { Player } from '../game';
import { Card, Coin, motionMs, useLite, useT } from '../ui';
import { useNames, Next, useNextLabel } from './shared';
import type { ScreenProps } from './shared';

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
        <label className="toggle"><input type="checkbox" checked={lite} onChange={(e) => setLite(e.target.checked)} /><span><b>{t(['Light mode', 'Modo ligero'])}</b><small>{t(['A flat board and no animations, for phones that lag. You can change it at any time in Settings (⋯ at the top).', 'Tablero plano y sin animaciones, para móviles que van lentos. Puedes cambiarlo cuando quieras en Ajustes (⋯ arriba).'])}</small></span></label>
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
