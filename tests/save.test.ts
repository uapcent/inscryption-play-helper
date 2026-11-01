import assert from 'node:assert/strict';
import { test } from 'node:test';
import { newGame } from '../src/game.ts';
import { SAVE_VERSION, readSave } from '../src/save.ts';

const v1 = {
  game: { kaycee: true, pelts: true, names: ['Ana', 'Bea'], phase: { kind: 'round' }, round: 2, lost: [1, 0], loser: 0, first: 0, carry: [], prospector: null },
  undo: [{ kaycee: true, pelts: true, names: ['Ana', 'Bea'], phase: { kind: 'fresh' }, round: 1, lost: [1, 0], loser: 0, first: 0, carry: [], prospector: null }],
};

test('a save from the first version keeps its game and gains a scale', () => {
  const s = readSave(JSON.stringify(v1));
  assert.equal(s.version, SAVE_VERSION);
  assert.equal(s.game.round, 2);
  assert.deepEqual(s.game.lost, [1, 0]);
  assert.equal(s.game.scale, 0);
  assert.equal(s.game.teeth, null);
  assert.equal(s.undo.length, 1);
  assert.equal(s.undo[0].scale, 0);
});

test('a current save loads as it was', () => {
  const game = { ...newGame(), phase: { kind: 'limoncello' as const }, round: 3, scale: -2, teeth: [1, 4] as [number, number] };
  const s = readSave(JSON.stringify({ version: SAVE_VERSION, game, undo: [] }));
  assert.deepEqual(s.game, game);
});

test('anything unreadable starts a fresh game instead of breaking the page', () => {
  for (const text of [null, '', 'not json', '42', '{}', '{"game":{"phase":{"kind":"dancing"}}}', JSON.stringify({ game: { ...v1.game, names: 'Ana' } })]) {
    const s = readSave(text);
    assert.equal(s.game.phase.kind, 'setup', String(text));
    assert.deepEqual(s.undo, []);
  }
});

test('broken steps are dropped from the undo history, the rest kept', () => {
  const s = readSave(JSON.stringify({ ...v1, undo: [...v1.undo, { phase: 'x' }, null] }));
  assert.equal(s.undo.length, 1);
});
