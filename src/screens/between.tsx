/** A Kaycee's Mod break between rounds: fresh start, card draft, upgrades and challenges. */
import { sigilByKey } from '../Sigils';
import { BOON_TEXT, EVENTS, HEAD_ICONS, HEAD_NAMES, TRIALS } from '../content';
import * as G from '../game';
import type { Activity, Game, Token } from '../game';
import { Card, Choice, D20, Die, Token as EventToken, useSettled, useT } from '../ui';
import { useNames, Next, useNextLabel, Lives, Dim } from './shared';
import type { Move, ScreenProps } from './shared';

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

export function BreakHead({ g, at }: { g: Game; at: number }) {
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
