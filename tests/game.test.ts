import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  BOONS, DECK_TRIALS, altarBoon, canFinish, carriedNow, chooseBoon, chooseOption, chooseStone, confirmPicks, drawFirst, drawSome, finishDeath, finishEvent, finishLimoncello,
  leshyTrials, limoncelloResult, loseLife, newGame, offer, pickToken, prospectorTurn, setStones, smokeFor, start, toCardDraft, toLimoncelloEnd, toPrepare, toUpgrades,
  trialResult, unpickToken, upgradeTokens, wakeProspector, type Game, type Token,
} from '../src/game.ts';

setStones(['ability_flying', 'ability_sharp', 'ability_reach', 'ability_strafe']);

/** A repeatable random source. */
const seeded = (seed = 1) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const fixed = (v: number) => () => v;

const kaycee = (pelts = true) => start(newGame(), { kaycee: true, pelts, names: ['Ana', 'Bea'] });
const base = () => start(newGame(), { kaycee: false, pelts: true, names: ['Ana', 'Bea'] });

/** Plays whatever is on the table, taking the first choices, until the next round starts. */
function playBreak(g: Game, rng: () => number): Game {
  g = toUpgrades(toCardDraft(g), rng);
  for (let i = 0; i < 40 && g.phase.kind !== 'round'; i++) {
    const p = g.phase;
    if (p.kind === 'pick') g = p.picks.length === 2 ? confirmPicks(g, rng) : pickToken(g, p.tokens.find((t) => !p.picks.includes(t)) as Token);
    else if (p.kind === 'play') {
      const a = p.activity;
      const token = p.picks[p.turn];
      if (token === 'totem') g = chooseStone(chooseOption(g, a.options![0]), a.stones![0]);
      if (token === 'leshy') g = trialResult(g, false, rng);
      if (token === 'deck') {
        g = trialResult(g, true, rng);
        if (g.phase.kind === 'play') g = chooseBoon(g, g.phase.activity.options![0]);
      }
      if (token === 'altar') g = offer(g, 'rare', rng);
      g = finishEvent(g, rng);
    } else if (p.kind === 'limoncello') g = toLimoncelloEnd(g);
    else if (p.kind === 'limoncelloEnd') g = finishLimoncello(limoncelloResult(g, 'both'));
    else assert.fail(`stuck on ${p.kind}`);
  }
  assert.equal(g.phase.kind, 'round');
  return g;
}

test('a new game first shows the cards, then the setup', () => {
  assert.equal(kaycee().phase.kind, 'cards');
  assert.equal(toPrepare(kaycee()).phase.kind, 'prepare');
});

test('a base game is 2 lives: two losses by one player end it', () => {
  let g = base();
  g = loseLife(g, 0);
  assert.equal(g.phase.kind, 'death');
  assert.equal(smokeFor(g.lost[0]), 'greater');
  g = finishDeath(g);
  assert.equal(g.round, 2);
  assert.equal(g.first, 0, 'the player who died goes first');
  g = loseLife(g, 0);
  assert.deepEqual(g.phase, { kind: 'over', winner: 1 });
});

test('a base game can go to 3 rounds and has no events', () => {
  let g = base();
  g = finishDeath(loseLife(g, 0));
  g = finishDeath(loseLife(g, 1));
  assert.equal(g.round, 3);
  g = loseLife(g, 1);
  assert.deepEqual(g.phase, { kind: 'over', winner: 0 });
});

test('Kaycee: 3 lives, Greater Smoke then Smoke, up to 5 rounds', () => {
  const rng = seeded(7);
  let g = kaycee();
  for (const loser of [0, 1, 0, 1] as const) {
    g = loseLife(g, loser);
    assert.equal(g.phase.kind, 'fresh');
    g = playBreak(g, rng);
  }
  assert.equal(g.round, 5);
  assert.deepEqual(g.lost, [2, 2]);
  assert.equal(smokeFor(1), 'greater');
  assert.equal(smokeFor(2), 'normal');
  g = loseLife(g, 1);
  assert.deepEqual(g.phase, { kind: 'over', winner: 0 });
});

test('the loser picks first; a player cannot take a token already taken', () => {
  const rng = seeded(3);
  let g = toUpgrades(toCardDraft(loseLife(kaycee(), 1)), rng);
  assert.equal(g.loser, 1);
  if (g.phase.kind !== 'pick') assert.fail();
  const [a, b] = g.phase.tokens;
  g = pickToken(g, a);
  const again = pickToken(g, a);
  assert.deepEqual(again, g);
  g = pickToken(g, b);
  if (g.phase.kind !== 'pick') assert.fail('the page must not move on by itself');
  assert.deepEqual(g.phase.picks, [a, b]);
  assert.deepEqual(pickToken(g, g.phase.tokens[2]), g, 'no third pick');
  g = confirmPicks(g, rng);
  if (g.phase.kind !== 'play') assert.fail();
  assert.deepEqual(g.phase.picks, [a, b]);
  assert.equal(g.phase.turn, 0);
});

test('Back takes back the last choice, and Confirm needs both', () => {
  const rng = seeded(3);
  let g = toUpgrades(toCardDraft(loseLife(kaycee(), 1)), rng);
  if (g.phase.kind !== 'pick') assert.fail();
  const [a, b, c] = g.phase.tokens;
  assert.deepEqual(unpickToken(g), g, 'nothing to take back yet');
  g = pickToken(g, a);
  assert.deepEqual(confirmPicks(g, rng), g, 'one choice is not enough');
  g = pickToken(g, b);
  g = unpickToken(g);
  if (g.phase.kind !== 'pick') assert.fail();
  assert.deepEqual(g.phase.picks, [a]);
  g = confirmPicks(pickToken(g, c), rng);
  if (g.phase.kind !== 'play') assert.fail();
  assert.deepEqual(g.phase.picks, [a, c]);
});

test('the Trading Post and the Trial of Skins need the Pelts expansion', () => {
  assert.equal(upgradeTokens({ pelts: true }).length, 6);
  assert.deepEqual(upgradeTokens({ pelts: false }), ['graft', 'campfire', 'mycologists', 'caravan', 'totem']);
  assert.ok(leshyTrials({ pelts: true }).includes('skins'));
  assert.ok(!leshyTrials({ pelts: false }).includes('skins'));
  const rng = seeded(11);
  for (let i = 0; i < 100; i++) {
    const g = toUpgrades(toCardDraft(loseLife(kaycee(false), 0)), rng);
    if (g.phase.kind !== 'pick') assert.fail();
    assert.ok(!g.phase.tokens.includes('trading'));
    assert.equal(new Set(g.phase.tokens).size, 3);
  }
});

test('drawSome draws without repeats', () => {
  const rng = seeded(5);
  for (let i = 0; i < 200; i++) {
    const d = drawSome(DECK_TRIALS, 3, rng);
    assert.equal(new Set(d).size, 3);
    assert.ok(d.every((x) => DECK_TRIALS.includes(x)));
  }
});

test('the first player can be either', () => {
  assert.equal(drawFirst(kaycee(), fixed(0.1)).first, 0);
  assert.equal(drawFirst(kaycee(), fixed(0.9)).first, 1);
});

test('round 2 has the Prospector cycle: wait, mark, strike, again', () => {
  let g = wakeProspector(kaycee(), 1);
  const steps = [g.prospector!.step];
  for (let i = 0; i < 3; i++) {
    g = prospectorTurn(g);
    steps.push(g.prospector!.step);
  }
  assert.deepEqual(steps, [0, 1, 2, 0]);
  assert.equal(loseLife(g, 0).prospector, null, 'he goes back to sleep when the round ends');
});

/** Takes the game to the challenge step of its break with a chosen pair of tokens. */
function atChallenge(token: Token, rng: () => number, lastTurn = false): Game {
  let g = loseLife(kaycee(), 0);
  g = { ...g, phase: { kind: 'play', group: 'challenge', picks: lastTurn ? ['caravan', token] : [token, 'caravan'], turn: lastTurn ? 1 : 0, activity: {} } };
  if (g.phase.kind === 'play' && (token === 'deck' || token === 'leshy')) g = { ...g, phase: { ...g.phase, activity: { options: ['a', 'b', 'c'] } } };
  return g;
}

test('failing a Leshy’s trial gives Aquasquirrels next round; passing leaves nothing to carry', () => {
  const rng = seeded(2);
  const failed = finishEvent(trialResult(atChallenge('leshy', rng), false, rng), rng);
  assert.deepEqual(failed.carry, [{ player: 0, round: 2, kind: 'aquasquirrels' }]);
  const passed = finishEvent(trialResult(atChallenge('leshy', rng), true, rng), rng);
  assert.deepEqual(passed.carry, []);
});

test('a Deck trial: failing costs nothing, passing needs a boon, never a Bone Lord', () => {
  const rng = seeded(2);
  const failed = finishEvent(trialResult(atChallenge('deck', rng), false, rng), rng);
  assert.deepEqual(failed.carry, []);
  let g = trialResult(atChallenge('deck', rng), true, rng);
  if (g.phase.kind !== 'play') assert.fail();
  assert.equal(g.phase.activity.options!.length, 3);
  assert.ok(g.phase.activity.options!.every((b) => BOONS.includes(b)));
  assert.equal(canFinish(g), false, 'a boon has to be chosen first');
  g = chooseBoon(g, g.phase.activity.options![0]);
  assert.equal(canFinish(g), true);
  g = finishEvent(g, rng);
  assert.equal(g.carry.length, 1);
  assert.equal(g.carry[0].kind, 'boon');
});

test('the altar: a rare pleases him; otherwise d20 1-5 nothing, 6-15 Lesser, 16-20 Bone Lord', () => {
  assert.equal(altarBoon({ offering: 'rare' }), 'bone_lord');
  for (const [roll, boon] of [[1, null], [5, null], [6, 'lesser_bone_lord'], [15, 'lesser_bone_lord'], [16, 'bone_lord'], [20, 'bone_lord']] as const) {
    assert.equal(altarBoon({ offering: 'other', roll }), boon);
  }
});

test('the Limoncello replaces the challenges of the third break only', () => {
  const rng = seeded(9);
  let g = kaycee();
  const seen: string[] = [];
  for (const loser of [0, 1, 0, 1] as const) {
    g = toUpgrades(toCardDraft(loseLife(g, loser)), rng);
    if (g.phase.kind !== 'pick') assert.fail();
    g = pickToken(g, g.phase.tokens[0]);
    if (g.phase.kind !== 'pick') assert.fail();
    g = confirmPicks(pickToken(g, g.phase.tokens.find((t) => !(g.phase as { picks: Token[] }).picks.includes(t))!), rng);
    for (let i = 0; i < 2; i++) {
      if (g.phase.kind !== 'play') assert.fail();
      const a = g.phase.activity;
      if (g.phase.picks[g.phase.turn] === 'totem') g = chooseStone(chooseOption(g, a.options![0]), a.stones![0]);
      g = finishEvent(g, rng);
    }
    seen.push(g.phase.kind);
    g = playBreak2(g, rng);
  }
  assert.deepEqual(seen, ['pick', 'pick', 'limoncello', 'pick']);
});

/** Finishes a break from its challenge step. */
function playBreak2(g: Game, rng: () => number): Game {
  if (g.phase.kind === 'limoncello') return finishLimoncello(limoncelloResult(toLimoncelloEnd(g), 'one'));
  if (g.phase.kind !== 'pick') assert.fail();
  g = confirmPicks(pickToken(pickToken(g, 'altar'), 'deck'), rng);
  g = finishEvent(offer(g, 'rare', rng), rng);
  g = finishEvent(trialResult(g, false, rng), rng);
  assert.equal(g.phase.kind, 'round');
  return g;
}

test('a totem built before the Limoncello is for the next round, not the fight', () => {
  const rng = seeded(4);
  let g = loseLife(kaycee(), 0);
  g = { ...g, round: 3, phase: { kind: 'play', group: 'upgrade', picks: ['totem', 'caravan'], turn: 0, activity: { options: ['birds'], stones: ['ability_sharp'] } } };
  g = finishEvent(chooseStone(chooseOption(g, 'birds'), 'ability_sharp'), rng);
  g = finishEvent(g, rng);
  assert.equal(g.phase.kind, 'limoncello');
  g = finishLimoncello(limoncelloResult(toLimoncelloEnd(g), 'both'));
  assert.equal(g.round, 4);
  assert.deepEqual(carriedNow(g, 0), [{ player: 0, round: 4, kind: 'totem', head: 'birds', stone: 'ability_sharp' }]);
  assert.deepEqual(carriedNow(g, 1), []);
});

test('carried effects last one round', () => {
  const rng = seeded(2);
  let g = finishEvent(trialResult(atChallenge('leshy', rng), false, rng), rng);
  g = { ...g, round: 2 };
  assert.equal(carriedNow(g, 0).length, 1);
  g = { ...g, round: 3 };
  assert.equal(carriedNow(g, 0).length, 0);
});
