import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { CARD_NOTES, TRICKY_CARDS } from '../src/notes.ts';
import { TUTORIALS, tutorialById } from '../src/tutorials.ts';

const json = (p: string) => JSON.parse(fs.readFileSync(new URL(p, import.meta.url), 'utf8'));
const groups = json('../src/data/cards.json') as { id: string; cards: { id: string; qty: number; sigils?: string[] }[] }[];
const faces = json('../src/data/faces.json') as Record<string, { p?: string; f?: string; c?: string; full?: string; g?: string[]; a?: string }>;
const sigils = json('../src/data/sigils.json') as { key: string }[];
const items = json('../src/data/items.json') as Record<string, unknown>;
const ids = new Set(groups.flatMap((g) => g.cards.map((c) => c.id)));
const exists = (p: string) => fs.existsSync(new URL(`../public/icons/${p}.png`, import.meta.url));

test('the list adds up to the printed deck', () => {
  assert.equal(groups.flatMap((g) => g.cards).reduce((n, c) => n + c.qty, 0), 369);
});

test('every note, tricky card and sigil refers to something real', () => {
  for (const id of Object.keys(CARD_NOTES)) assert.ok(ids.has(id), `note for unknown card ${id}`);
  for (const id of TRICKY_CARDS) {
    assert.ok(ids.has(id), `tricky card ${id}`);
    assert.ok(CARD_NOTES[id]?.tutorial, `tricky card ${id} has no tutorial`);
  }
  for (const n of Object.values(CARD_NOTES)) if (n.tutorial) assert.ok(tutorialById(n.tutorial), `tutorial ${n.tutorial}`);
  const keys = new Set(sigils.map((s) => s.key));
  for (const c of groups.flatMap((g) => g.cards)) for (const s of c.sigils ?? []) assert.ok(keys.has(s), `${c.id} has sigil ${s}`);
});

test('every tutorial is reachable and draws only what exists', () => {
  const linked = new Set(Object.values(CARD_NOTES).map((n) => n.tutorial));
  for (const t of TUTORIALS) {
    assert.ok(linked.has(t.id), `no card opens ${t.id}`);
    assert.ok(t.steps.length >= 2, t.id);
    for (const s of t.steps) {
      const keys = s.pieces.map((p) => p.key);
      assert.equal(new Set(keys).size, keys.length, `repeated piece in ${t.id}`);
      for (const p of s.pieces) if (p.face) assert.ok(faces[p.face], `${t.id} uses face ${p.face}`);
      for (const p of s.pieces) if (p.back) assert.ok(exists(`backs/${p.back}`), `${t.id} uses back ${p.back}`);
    }
  }
});

test('every face and item has its art', () => {
  for (const [id, f] of Object.entries(faces)) {
    if (f.full) { assert.ok(exists(f.full), id); continue; }
    assert.ok(exists(`frames/${f.f}`), `${id} frame ${f.f}`);
    if (f.p) assert.ok(exists(`portraits/${f.p}`), `${id} portrait ${f.p}`);
    if (f.c) assert.ok(exists(`costs/${f.c}`), `${id} cost ${f.c}`);
    for (const s of f.g ?? []) assert.ok(exists(`sigils/${s}`), `${id} sigil ${s}`);
    if (f.a?.startsWith('icon:')) assert.ok(exists(`stats/${f.a.slice(5)}_stat_icon`), `${id} stat`);
  }
  for (const [id, it] of Object.entries(items) as [string, { icon?: string }][]) if (it.icon) assert.ok(exists(it.icon), `${id} icon`);
});
