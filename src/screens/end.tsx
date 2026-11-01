/** The Limoncello after round 3, and the end of the game. */
import { LimoncelloBoard } from '../Board';
import { LimoncelloScale } from '../ScaleCounter';
import { DEATH_CARD_STEPS } from '../content';
import * as G from '../game';
import { Card, Choice, useT } from '../ui';
import { BreakHead } from './between';
import { useNames, Next, Lives } from './shared';
import type { ScreenProps } from './shared';

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
      <LimoncelloScale g={g} move={move} left={a} names={[name(0), name(1)]} />
      <div className="two-col">
      <Card title={t(['Setup', 'Preparación'])} icon="nodes/bossnode_royal">
        <ul className="steps">
          <li>{t(['The ship is two cards side by side, in the middle of one row. You share the other row.', 'El barco son dos cartas juntas, en el centro de una fila. Compartís la otra fila.'])}</li>
          <li>{t(['Each player: your deck, 10 Squirrels, Smoke and items; draw 3 cards and 1 Squirrel, with no bones.', 'Cada jugador: tu mazo, 10 Ardillas, Humo y objetos; roba 3 cartas y 1 Ardilla, sin huesos.'])}</li>
          <li>{t(['Each player has a tooth (the scale above, or any token on the table). Both start at 0; the ship’s hits move a tooth towards its owner’s end.', 'Cada jugador tiene un diente (la balanza de arriba, o cualquier ficha en la mesa). Empiezan en 0; los golpes del barco mueven el diente hacia el extremo de su dueño.'])}</li>
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
