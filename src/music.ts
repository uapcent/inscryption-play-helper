/**
 * Music for the table, from the players' own files. The files stay in this browser (IndexedDB):
 * nothing is uploaded, and the site ships no music.
 *
 * Each screen asks for a slot; a slot with no file falls back to a broader one, or to silence.
 * A slot can hold several files: one is picked at random each time its moment starts, and loops.
 */
import type { Game } from './game';

export type Slot = 'cabin' | 'battle' | 'prospector' | 'boss' | 'ending';
export const SLOTS: Slot[] = ['cabin', 'battle', 'prospector', 'boss', 'ending'];

/** What a slot falls back to when it has no file. */
const FALLBACK: Record<Slot, Slot | null> = {
  cabin: null,
  battle: 'cabin',
  prospector: 'battle',
  boss: 'battle',
  ending: 'cabin',
};

/** The music a step of the game asks for. */
export function slotFor(g: Pick<Game, 'phase' | 'kaycee' | 'round'>): Slot {
  switch (g.phase.kind) {
    // The Prospector's round: round 2 of a Kaycee's Mod game (isProspectorRound).
    case 'round': return g.kaycee && g.round === 2 ? 'prospector' : 'battle';
    case 'limoncello': return 'boss';
    case 'over': return 'ending';
    default: return 'cabin';
  }
}

/** The slot that will actually play: the first in the fallback chain that has a file. */
export function resolveSlot(slot: Slot, has: (s: Slot) => boolean): Slot | null {
  for (let s: Slot | null = slot; s; s = FALLBACK[s]) if (has(s)) return s;
  return null;
}
export const fallbackOf = (s: Slot) => FALLBACK[s];

// ---------- the files, in IndexedDB ----------

export interface Track { id: string; name: string; blob: Blob }
export type Tracks = Partial<Record<Slot, Track[]>>;
export const newTrackId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Which of a slot's tracks to play: any at random, but not the one that played last time,
 * when there is another.
 */
export function pickTrack(list: readonly { id: string }[], last: string | undefined, rng: () => number = Math.random): number {
  const pool = list.length > 1 ? list.map((_, i) => i).filter((i) => list[i].id !== last) : list.map((_, i) => i);
  return pool[Math.floor(rng() * pool.length)] ?? 0;
}
const DB = 'inscryption-helper-music';
const STORE = 'tracks';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then((db) => new Promise<T>((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => { resolve(req.result); db.close(); };
    req.onerror = () => { reject(req.error); db.close(); };
  }));
}

export async function loadTracks(): Promise<Tracks> {
  const out: Tracks = {};
  try {
    await Promise.all(SLOTS.map(async (s) => {
      // A list per slot; the first version kept a single track.
      const saved = await tx<Track[] | Omit<Track, 'id'> | undefined>('readonly', (st) => st.get(s));
      // The old single track gets a fixed id, so loading it twice finds the same track.
      const list = (Array.isArray(saved) ? saved : saved ? [{ ...saved, id: `first-${s}` }] : []).filter((t) => t.blob);
      if (list.length) out[s] = list;
    }));
  } catch { /* no IndexedDB (a private window, say): no music */ }
  return out;
}
/** Saves a slot's whole list; an empty list removes it. */
export const saveSlot = (s: Slot, list: Track[]) =>
  tx<unknown>('readwrite', (st) => (list.length ? st.put(list, s) : st.delete(s)) as IDBRequest<unknown>);

// ---------- the player ----------

const FADE_S = 1.2;

interface Playing { slot: Slot; id: string; el: HTMLAudioElement; url: string; gain: GainNode | null }

/**
 * Loops one track at a time (each loops with itself, as in the game) and fades between them. Volume goes through Web Audio, because
 * iPhones ignore an audio element's volume; without Web Audio it falls back to the element.
 */
class Player {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private tracks: Tracks = {};
  /** The track each slot played last, so the next time picks another. */
  private last: Partial<Record<Slot, string>> = {};
  private now: Playing | null = null;
  private wanted: Slot | null = null;
  private on = false;
  private volume = 0.7;

  private context() {
    if (this.ctx || typeof AudioContext === 'undefined') return this.ctx;
    try {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    } catch { this.ctx = null; }
    return this.ctx;
  }

  setTracks(tracks: Tracks) {
    this.tracks = tracks;
    // What's playing keeps going unless its file was removed.
    if (this.now && !tracks[this.now.slot]?.some((t) => t.id === this.now!.id)) this.stop(this.now);
    this.update();
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.master) this.master.gain.value = v;
    else if (this.now) this.now.el.volume = v;
  }

  setOn(on: boolean) {
    this.on = on;
    if (on) this.unlock();
    this.update();
  }

  want(slot: Slot | null) {
    this.wanted = slot;
    this.update();
  }

  /** Browsers only start sound from a tap: call this from one. */
  unlock() {
    const ctx = this.context();
    if (ctx?.state === 'suspended') ctx.resume().catch(() => {});
    if (this.now?.el.paused && this.on) this.now.el.play().catch(() => {});
  }

  private update() {
    const slot = this.on && this.wanted ? resolveSlot(this.wanted, (s) => !!this.tracks[s]?.length) : null;
    if (slot === (this.now?.slot ?? null)) return;
    if (this.now) this.stop(this.now);
    this.now = slot ? this.start(slot) : null;
  }

  /** A moment starts: one of its tracks, at random. */
  private start(slot: Slot): Playing {
    const list = this.tracks[slot]!;
    const track = list[pickTrack(list, this.last[slot])];
    this.last[slot] = track.id;
    const url = URL.createObjectURL(track.blob);
    const el = new Audio(url);
    el.loop = true;
    const ctx = this.context();
    let gain: GainNode | null = null;
    if (ctx && this.master) {
      gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(1, ctx.currentTime + FADE_S);
      ctx.createMediaElementSource(el).connect(gain);
      gain.connect(this.master);
    } else {
      el.volume = this.volume;
    }
    el.play().catch(() => { /* waits for a tap: unlock() */ });
    return { slot, id: track.id, el, url, gain };
  }

  private stop(p: Playing) {
    if (this.now === p) this.now = null;
    const end = () => { p.el.pause(); p.el.removeAttribute('src'); p.el.load(); URL.revokeObjectURL(p.url); p.gain?.disconnect(); };
    if (p.gain && this.ctx && this.ctx.state === 'running') {
      const t = this.ctx.currentTime;
      p.gain.gain.cancelScheduledValues(t);
      p.gain.gain.setValueAtTime(p.gain.gain.value, t);
      p.gain.gain.linearRampToValueAtTime(0, t + FADE_S);
      setTimeout(end, FADE_S * 1000 + 50);
    } else end();
  }
}

export const music = new Player();
