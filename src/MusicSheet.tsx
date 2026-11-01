import { useEffect, useRef, useState } from 'react';
import type { T } from './content';
import { SLOTS, fallbackOf, removeTrack, saveTrack, type Slot, type Track } from './music';
import { useT } from './ui';

export const SLOT_TEXT: Record<Slot, { title: T; when: T }> = {
  cabin: {
    title: ['Cabin', 'Cabaña'],
    when: ['Setting up, the draft, and everything between rounds.', 'La preparación, el draft y todo lo que pasa entre rondas.'],
  },
  battle: {
    title: ['Battle', 'Combate'],
    when: ['During a round.', 'Durante una ronda.'],
  },
  prospector: {
    title: ['The Prospector', 'El Buscador de oro'],
    when: ['Round 2 of a Kaycee’s Mod game, his round.', 'La ronda 2 de una partida de Kaycee’s Mod, la suya.'],
  },
  boss: {
    title: ['The Limoncello', 'El Limoncello'],
    when: ['The boss fight after round 3.', 'El combate contra el jefe después de la ronda 3.'],
  },
  ending: {
    title: ['The end', 'El final'],
    when: ['The game is over: the death card.', 'Se acabó la partida: la carta de muerte.'],
  },
};

/** The music settings: on or off, the volume, and a file of the players' own for each moment. */
export function MusicSheet({ on, setOn, volume, setVolume, tracks, setTrack, onClose }: {
  on: boolean;
  setOn: (on: boolean) => void;
  volume: number;
  setVolume: (v: number) => void;
  tracks: Partial<Record<Slot, Track>>;
  setTrack: (s: Slot, t: Track | null) => void;
  onClose: () => void;
}) {
  const t = useT();
  const ref = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const choose = async (s: Slot, file: File | undefined) => {
    if (!file) return;
    setError(null);
    const track = { name: file.name, blob: file };
    try {
      await saveTrack(s, track);
    } catch {
      setError(t(['This browser couldn’t keep the file. It will play until the page is closed.', 'Este navegador no ha podido guardar el archivo. Sonará hasta que cierres la página.']));
    }
    setTrack(s, track);
  };
  const remove = (s: Slot) => {
    removeTrack(s).catch(() => {});
    setTrack(s, null);
  };
  const usedFor = (s: Slot) => {
    for (let f = fallbackOf(s); f; f = fallbackOf(f)) if (tracks[f]) return t(SLOT_TEXT[f].title);
    return null;
  };

  return (
    <dialog ref={ref} className="sheet" onClose={onClose} onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}>
      <div className="sheet-body">
        <button type="button" className="sheet-close" aria-label={t(['Close', 'Cerrar'])} onClick={() => ref.current?.close()}>×</button>
        <h2 className="sheet-title">{t(['Music', 'Música'])}</h2>
        <p className="note muted">{t([
          'Choose your own music files for each moment of the game, such as the soundtrack if you own it. They stay in this browser: nothing is uploaded.',
          'Elige tus propios archivos de música para cada momento de la partida, como la banda sonora si la tienes. Se quedan en este navegador: no se sube nada.',
        ])}</p>
        <div className="music-controls">
          <button type="button" className={on ? 'primary' : ''} aria-pressed={on} onClick={() => setOn(!on)}>
            {on ? t(['Music: on', 'Música: activada']) : t(['Music: off', 'Música: desactivada'])}
          </button>
          <label className="music-volume">
            <span>{t(['Volume', 'Volumen'])}</span>
            <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
          </label>
        </div>
        {error && <p className="warning">{error}</p>}
        <ul className="music-slots">
          {SLOTS.map((s) => {
            const track = tracks[s];
            const instead = usedFor(s);
            return (
              <li key={s}>
                <div className="music-slot-text">
                  <b>{t(SLOT_TEXT[s].title)}</b>
                  <small>{t(SLOT_TEXT[s].when)}</small>
                  <em className={track ? 'music-file' : 'muted'}>
                    {track ? track.name : instead ? t([`No file: plays ${instead}`, `Sin archivo: suena ${instead}`]) : t(['No file: silence', 'Sin archivo: silencio'])}
                  </em>
                </div>
                <div className="music-slot-tools">
                  <label className="button-like">
                    {track ? t(['Change', 'Cambiar']) : t(['Choose a file', 'Elegir archivo'])}
                    <input type="file" accept="audio/*" onChange={(e) => { choose(s, e.target.files?.[0]); e.target.value = ''; }} />
                  </label>
                  {track && <button type="button" onClick={() => remove(s)}>{t(['Remove', 'Quitar'])}</button>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </dialog>
  );
}
