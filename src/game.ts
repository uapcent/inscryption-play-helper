/**
 * The flow of a game, as pure functions over a plain state, so it can be saved, undone and tested.
 * The table keeps the board and the cards: this tracks rounds, lives, the scale during a round, the
 * events between rounds and what carries over to the next round.
 */
export type Player = 0 | 1;
export const other = (p: Player): Player => (p === 0 ? 1 : 0);

export type Upgrade = 'graft' | 'campfire' | 'mycologists' | 'caravan' | 'totem' | 'trading';
export type Challenge = 'leshy' | 'deck' | 'altar';
export type Token = Upgrade | Challenge;

export const LESHY_TRIALS = ['ring', 'rarity', 'skins', 'winged', 'finned', 'young'];
export const DECK_TRIALS = ['blood', 'bones', 'strength', 'life', 'sigils', 'kin'];
export const BOONS = ['ambidextrous', 'goat', 'forest', 'magpie'];
export const HEADS = ['birds', 'bugs', 'deer', 'reptiles', 'squirrels', 'wolves'];

/** Something that takes effect in a later round. */
export type Carry =
  | { player: Player; round: number; kind: 'boon'; id: string }
  | { player: Player; round: number; kind: 'aquasquirrels' }
  | { player: Player; round: number; kind: 'totem'; head: string; stone: string };

/** What the current player is doing with their event; filled in as they go. */
export interface Activity {
  options?: string[];
  chosen?: string;
  stones?: string[];
  stone?: string;
  passed?: boolean;
  /** The altar: what was sacrificed. */
  offering?: 'rare' | 'other';
  roll?: number;
  /** The boon won, shown once the player has it. */
  boon?: string;
}

export type Phase =
  | { kind: 'setup' }
  | { kind: 'cards' }
  | { kind: 'prepare' }
  | { kind: 'draft' }
  | { kind: 'first' }
  | { kind: 'round' }
  /** A base game's life lost: both players follow the same steps. */
  | { kind: 'death' }
  | { kind: 'fresh' }
  | { kind: 'cardDraft' }
  | { kind: 'pick'; group: 'upgrade' | 'challenge'; tokens: Token[]; picks: Token[] }
  | { kind: 'play'; group: 'upgrade' | 'challenge'; picks: Token[]; turn: 0 | 1; activity: Activity }
  | { kind: 'limoncello' }
  | { kind: 'limoncelloEnd'; result: 'both' | 'one' | 'none' | null }
  | { kind: 'over'; winner: Player };

export interface Game {
  kaycee: boolean;
  pelts: boolean;
  names: [string, string];
  phase: Phase;
  round: number;
  lost: [number, number];
  /** Who lost the last round; they go first in the next one and choose first between rounds. */
  loser: Player | null;
  /** Who goes first this round. */
  first: Player | null;
  carry: Carry[];
  /** The Prospector, in round 2 of a Kaycee's Mod game: null while asleep, then the cycle's step. */
  prospector: { waker: Player; step: 0 | 1 | 2 } | null;
  /** The scale's tooth during a round, from -5 (5 against the first player) to 5 (5 against the second). Missing in old saves. */
  scale?: number;
}

export type Rng = () => number;

export const newGame = (): Game => ({
  kaycee: true,
  pelts: true,
  names: ['', ''],
  phase: { kind: 'setup' },
  round: 1,
  lost: [0, 0],
  loser: null,
  first: null,
  carry: [],
  prospector: null,
  scale: 0,
});

export const livesTotal = (g: Pick<Game, 'kaycee'>) => (g.kaycee ? 3 : 2);
export const maxRounds = (g: Pick<Game, 'kaycee'>) => (g.kaycee ? 5 : 3);
export const isProspectorRound = (g: Game) => g.kaycee && g.round === 2;
/** The third break, after round 3, has the Limoncello instead of the challenges. */
const isLimoncelloBreak = (g: Game) => g.round === 3;

/** Random, without repeats: Fisher-Yates over a copy. */
export function drawSome<T>(pool: readonly T[], n: number, rng: Rng): T[] {
  const a = [...pool];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}
export const rollD20 = (rng: Rng) => Math.floor(rng() * 20) + 1;

export const upgradeTokens = (g: Pick<Game, 'pelts'>): Upgrade[] =>
  ['graft', 'campfire', 'mycologists', 'caravan', 'totem', ...(g.pelts ? ['trading' as const] : [])];
export const challengeTokens: Challenge[] = ['leshy', 'deck', 'altar'];
export const leshyTrials = (g: Pick<Game, 'pelts'>) => LESHY_TRIALS.filter((t) => g.pelts || t !== 'skins');

/** Who is playing in a play or pick step: the round's loser first. */
export const turnPlayer = (g: Game, turn: 0 | 1): Player => (turn === 0 ? g.loser! : other(g.loser!));

/** The carried effects that apply to a player this round. */
export const carriedNow = (g: Game, p: Player) => g.carry.filter((c) => c.player === p && c.round === g.round);

/** The Smoke a player got from the life they just lost, if any. */
export const smokeFor = (lost: number): 'greater' | 'normal' | null => (lost === 1 ? 'greater' : lost === 2 ? 'normal' : null);

export function start(g: Game, config: Pick<Game, 'kaycee' | 'pelts' | 'names'>): Game {
  return {
    ...newGame(),
    kaycee: config.kaycee,
    pelts: config.kaycee && config.pelts,
    names: config.names,
    phase: { kind: 'cards' },
  };
}

export const toPrepare = (g: Game): Game => ({ ...g, phase: { kind: 'prepare' } });
export const toDraft = (g: Game): Game => ({ ...g, phase: { kind: 'draft' } });
export const toFirst = (g: Game): Game => ({ ...g, phase: { kind: 'first' } });
/** Round 1: chance decides, as with the Leshy card. */
export const drawFirst = (g: Game, rng: Rng): Game => ({ ...g, first: rng() < 0.5 ? 0 : 1 });
export const beginRound = (g: Game): Game => ({ ...g, phase: { kind: 'round' }, prospector: null, scale: 0 });

/** The scale: 5 against a player costs them a life, so the tooth stays between 5 and 5. */
export const SCALE_MAX = 5;
const towards = (p: Player) => (p === 0 ? -1 : 1);
/** How far the tooth is towards a player's end: their damage taken, net of what they dealt. */
export const scaleAgainst = (g: Pick<Game, 'scale'>, p: Player) => towards(p) * (g.scale ?? 0) || 0;
/** Damage to a player moves the tooth towards their end; a negative amount moves it back. */
export function tipScale(g: Game, p: Player, damage = 1): Game {
  const scale = Math.max(-SCALE_MAX, Math.min(SCALE_MAX, (g.scale ?? 0) + towards(p) * damage));
  return scale === (g.scale ?? 0) ? g : { ...g, scale };
}
/** Puts the tooth straight on a step: `n` against a player (0 is the middle). */
export function setScale(g: Game, p: Player, n: number): Game {
  const scale = towards(p) * Math.max(0, Math.min(SCALE_MAX, n)) || 0;
  return scale === (g.scale ?? 0) ? g : { ...g, scale };
}

export function loseLife(g: Game, p: Player): Game {
  const lost: [number, number] = [...g.lost];
  lost[p] += 1;
  const next: Game = { ...g, lost, loser: p, prospector: null, scale: 0 };
  if (lost[p] >= livesTotal(g)) return { ...next, phase: { kind: 'over', winner: other(p) } };
  return { ...next, phase: { kind: g.kaycee ? 'fresh' : 'death' } };
}

const nextRound = (g: Game): Game => ({ ...g, round: g.round + 1, first: g.loser, phase: { kind: 'round' }, prospector: null, scale: 0 });

/** A base game: the steps are done, on to the next round. */
export const finishDeath = (g: Game): Game => nextRound(g);
export const toCardDraft = (g: Game): Game => ({ ...g, phase: { kind: 'cardDraft' } });
export const toUpgrades = (g: Game, rng: Rng): Game => ({
  ...g,
  phase: { kind: 'pick', group: 'upgrade', tokens: drawSome(upgradeTokens(g), 3, rng), picks: [] },
});

/** Takes a token: first the round's loser, then the other player. Nothing happens until they confirm. */
export function pickToken(g: Game, token: Token): Game {
  const { phase } = g;
  if (phase.kind !== 'pick' || phase.picks.length >= 2 || !phase.tokens.includes(token) || phase.picks.includes(token)) return g;
  return { ...g, phase: { ...phase, picks: [...phase.picks, token] } };
}

/** Takes back the last choice. */
export function unpickToken(g: Game): Game {
  const { phase } = g;
  if (phase.kind !== 'pick' || !phase.picks.length) return g;
  return { ...g, phase: { ...phase, picks: phase.picks.slice(0, -1) } };
}

/** Both have chosen: they play their events, the round's loser first. */
export function confirmPicks(g: Game, rng: Rng): Game {
  const { phase } = g;
  if (phase.kind !== 'pick' || phase.picks.length < 2) return g;
  return { ...g, phase: { kind: 'play', group: phase.group, picks: phase.picks, turn: 0, activity: enter(g, phase.picks[0], rng) } };
}

/** What an event reveals when a player starts it. */
function enter(g: Game, token: Token, rng: Rng): Activity {
  switch (token) {
    case 'totem': return { options: drawSome(HEADS, 3, rng), stones: drawSome(STONE_KEYS, 3, rng) };
    case 'leshy': return { options: drawSome(leshyTrials(g), 3, rng) };
    case 'deck': return { options: drawSome(DECK_TRIALS, 3, rng) };
    default: return {};
  }
}

/** The 19 sigil stones, by sigil key (set from the data at start-up). */
let STONE_KEYS: string[] = [];
export const setStones = (keys: string[]) => { STONE_KEYS = keys; };

const setActivity = (g: Game, patch: Partial<Activity>): Game =>
  g.phase.kind === 'play' ? { ...g, phase: { ...g.phase, activity: { ...g.phase.activity, ...patch } } } : g;

export const chooseOption = (g: Game, id: string): Game => setActivity(g, { chosen: id });
export const chooseStone = (g: Game, id: string): Game => setActivity(g, { stone: id });

/** A trial's result: Leshy's failure gives the Aquasquirrels, a Deck trial's pass reveals 3 boons. */
export function trialResult(g: Game, passed: boolean, rng: Rng): Game {
  if (g.phase.kind !== 'play') return g;
  const token = g.phase.picks[g.phase.turn];
  if (token === 'deck' && passed) {
    return setActivity(g, { passed, options: drawSome(BOONS, 3, rng), chosen: undefined });
  }
  return setActivity(g, { passed });
}

export const chooseBoon = (g: Game, id: string): Game => setActivity(g, { boon: id });

/** The altar: a rare or a death card pleases him; any other card is a d20. */
export function offer(g: Game, offering: 'rare' | 'other', rng: Rng): Game {
  return setActivity(g, { offering, roll: offering === 'other' ? rollD20(rng) : undefined });
}
export const altarBoon = (a: Activity): 'bone_lord' | 'lesser_bone_lord' | null => {
  if (a.offering === 'rare') return 'bone_lord';
  if (a.roll === undefined || a.roll <= 5) return null;
  return a.roll <= 15 ? 'lesser_bone_lord' : 'bone_lord';
};

/** Whether the current player has finished what the event asks of the helper. */
export function canFinish(g: Game): boolean {
  if (g.phase.kind !== 'play') return false;
  const a = g.phase.activity;
  switch (g.phase.picks[g.phase.turn]) {
    case 'totem': return !!a.chosen && !!a.stone;
    case 'leshy': return a.passed !== undefined;
    case 'deck': return a.passed === false || !!a.boon;
    case 'altar': return !!a.offering;
    default: return true;
  }
}

/** The effect the finished event leaves for the next round. */
function carriedFrom(g: Game, token: Token, a: Activity, player: Player): Carry | null {
  const round = g.round + 1;
  if (token === 'totem') return { player, round, kind: 'totem', head: a.chosen!, stone: a.stone! };
  if (token === 'leshy' && a.passed === false) return { player, round, kind: 'aquasquirrels' };
  if (token === 'deck' && a.boon) return { player, round, kind: 'boon', id: a.boon };
  if (token === 'altar') {
    const id = altarBoon(a);
    if (id) return { player, round, kind: 'boon', id };
  }
  return null;
}

/** The current player is done: the next one plays, or the break moves on. */
export function finishEvent(g: Game, rng: Rng): Game {
  const { phase } = g;
  if (phase.kind !== 'play' || !canFinish(g)) return g;
  const c = carriedFrom(g, phase.picks[phase.turn], phase.activity, turnPlayer(g, phase.turn));
  const next: Game = c ? { ...g, carry: [...g.carry, c] } : g;
  if (phase.turn === 0) {
    return { ...next, phase: { ...phase, turn: 1, activity: enter(g, phase.picks[1], rng) } };
  }
  if (phase.group === 'challenge') return nextRound(next);
  if (isLimoncelloBreak(g)) return { ...next, phase: { kind: 'limoncello' } };
  return { ...next, phase: { kind: 'pick', group: 'challenge', tokens: drawSome(challengeTokens, 3, rng), picks: [] } };
}

export const toLimoncelloEnd = (g: Game): Game => ({ ...g, phase: { kind: 'limoncelloEnd', result: null } });
export const limoncelloResult = (g: Game, result: 'both' | 'one' | 'none'): Game =>
  g.phase.kind === 'limoncelloEnd' ? { ...g, phase: { ...g.phase, result } } : g;
export const finishLimoncello = (g: Game): Game => nextRound(g);

export const wakeProspector = (g: Game, waker: Player): Game => ({ ...g, prospector: { waker, step: 0 } });
/** A turn ended: wait, mark, strike, and again. */
export const prospectorTurn = (g: Game): Game =>
  g.prospector ? { ...g, prospector: { ...g.prospector, step: ((g.prospector.step + 1) % 3) as 0 | 1 | 2 } } : g;
