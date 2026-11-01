/**
 * The saved game, in the browser's storage. Saves are checked and brought up to date when
 * loaded, so a game in progress survives a new version of the helper.
 */
import { COLUMNS, PHASE_KINDS, newGame, noDamage, type Game } from './game.ts';

/** Bump this, and add a step in `upgradeGame`, when the shape of a Game changes. */
export const SAVE_VERSION = 3;

export interface Saved { version: number; game: Game; undo: Game[] }

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const pair = (x: unknown, ok: (v: unknown) => boolean) => Array.isArray(x) && x.length === 2 && x.every(ok);
const isNumber = (v: unknown) => typeof v === 'number' && Number.isFinite(v);

/** A saved game made current, or null if it can't be one. */
export function upgradeGame(raw: unknown): Game | null {
  if (!isObject(raw) || !isObject(raw.phase) || !PHASE_KINDS.includes(raw.phase.kind as Game['phase']['kind'])) return null;
  if (!pair(raw.names, (v) => typeof v === 'string') || !pair(raw.lost, isNumber) || !isNumber(raw.round)) return null;
  const phase = raw.phase as Record<string, unknown>;
  if ((phase.kind === 'pick' || phase.kind === 'play') && !Array.isArray(phase.picks)) return null;
  const counter = (v: unknown) => isNumber(v) && (v as number) >= 0;
  const row = (v: unknown) => Array.isArray(v) && v.length === COLUMNS && v.every(counter);
  // Version 1 had no scale or teeth, version 2 no bones or damage; anything else missing takes its starting value.
  return {
    ...newGame(),
    ...raw,
    scale: isNumber(raw.scale) ? Math.max(-5, Math.min(5, raw.scale as number)) : 0,
    teeth: pair(raw.teeth, isNumber) ? raw.teeth as [number, number] : null,
    bones: pair(raw.bones, counter) ? raw.bones as [number, number] : [0, 0],
    damage: pair(raw.damage, row) ? raw.damage as [number[], number[]] : noDamage(),
  } as Game;
}

/** Reads a save; anything unreadable starts a fresh game rather than breaking the page. */
export function readSave(text: string | null): Saved {
  const fresh: Saved = { version: SAVE_VERSION, game: newGame(), undo: [] };
  if (!text) return fresh;
  try {
    const raw: unknown = JSON.parse(text);
    if (!isObject(raw)) return fresh;
    const game = upgradeGame(raw.game);
    if (!game) return fresh;
    const undo = (Array.isArray(raw.undo) ? raw.undo : []).map(upgradeGame).filter((g): g is Game => g !== null);
    return { version: SAVE_VERSION, game, undo };
  } catch {
    return fresh;
  }
}
