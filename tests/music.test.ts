import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pickTrack, resolveSlot, slotFor, type Slot } from '../src/music.ts';

const at = (kind: string, round = 1, kaycee = true) => ({ phase: { kind } as never, round, kaycee });

test('each step of the game asks for its music', () => {
  assert.equal(slotFor(at('setup')), 'cabin');
  assert.equal(slotFor(at('pick')), 'cabin');
  assert.equal(slotFor(at('round')), 'battle');
  assert.equal(slotFor(at('round', 2)), 'prospector');
  assert.equal(slotFor(at('round', 2, false)), 'battle', 'no Prospector in the base game');
  assert.equal(slotFor(at('limoncello', 3)), 'boss');
  assert.equal(slotFor(at('limoncelloEnd', 3)), 'cabin');
  assert.equal(slotFor(at('over')), 'ending');
});

test('a moment with no file plays a broader one, or nothing', () => {
  const has = (...slots: Slot[]) => (s: Slot) => slots.includes(s);
  assert.equal(resolveSlot('boss', has('boss', 'battle')), 'boss');
  assert.equal(resolveSlot('boss', has('battle')), 'battle');
  assert.equal(resolveSlot('prospector', has('cabin')), 'cabin');
  assert.equal(resolveSlot('ending', has('battle')), null);
  assert.equal(resolveSlot('cabin', has()), null);
});

test('a moment with several tracks picks one at random, never the last one again', () => {
  const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  assert.equal(pickTrack(list, undefined, () => 0), 0);
  assert.equal(pickTrack(list, undefined, () => 0.99), 2);
  for (const r of [0, 0.4, 0.99]) assert.notEqual(pickTrack(list, 'a', () => r), 0);
  assert.equal(pickTrack([{ id: 'a' }], 'a', () => 0.5), 0, 'a lone track plays again');
  const seen = new Set<number>();
  for (let i = 0; i < 200; i++) seen.add(pickTrack(list, undefined));
  assert.equal(seen.size, 3);
});
