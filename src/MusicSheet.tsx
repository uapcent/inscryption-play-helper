import { useEffect, useRef, useState } from 'react';
import type { T } from './content';
import { SLOTS, fallbackOf, newTrackId, saveSlot, type Slot, type Track, type Tracks } from './music';
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

/** The music settings: on or off, the volume, and the players' own files for each moment. */
export function MusicSheet({ on, setOn, volume, setVolume, tracks, setSlot, onClose }: {
  on: boolean;
  setOn: (on: boolean) => void;
  volume: number;
  setVolume: (v: number) => void;
  tracks: Tracks;
  setSlot: (s: Slot, list: Track[]) => void;
  onClose: () => void;
}) {
  const t = useT();
  const ref = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const keep = (s: Slot, list: Track[]) => {
    setSlot(s, list);
    saveSlot(s, list).catch(() => setError(t([
      'This browser couldn’t keep the files. They will play until the page is closed.',
      'Este navegador no ha podido guardar los archivos. Sonarán hasta que cierres la página.',
    ])));
  };
  const add = (s: Slot, files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    const added = [...files].map((f): Track => ({ id: newTrackId(), name: f.name, blob: f }));
    keep(s, [...(tracks[s] ?? []), ...added]);
  };
  const remove = (s: Slot, id: string) => keep(s, (tracks[s] ?? []).filter((x) => x.id !== id));
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
          'Choose your own music files for each moment of the game, such as the soundtrack if you own it. With several, one is picked at random each time the moment starts, and it loops. They stay in this browser: nothing is uploaded.',
          'Elige tus propios archivos de música para cada momento de la partida, como la banda sonora si la tienes. Con varios, se elige uno al azar cada vez que empieza el momento, y se repite en bucle. Se quedan en este navegador: no se sube nada.',
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
            const list = tracks[s] ?? [];
            const instead = usedFor(s);
            return (
              <li key={s}>
                <div className="music-slot-text">
                  <b>{t(SLOT_TEXT[s].title)}</b>
                  <small>{t(SLOT_TEXT[s].when)}</small>
                  {list.length === 0 && (
                    <em className="muted">{instead ? t([`No file: plays ${instead}`, `Sin archivo: suena ${instead}`]) : t(['No file: silence', 'Sin archivo: silencio'])}</em>
                  )}
                  {list.length > 1 && <em className="muted">{t([`${list.length} tracks: one at random each time`, `${list.length} pistas: una al azar cada vez`])}</em>}
                </div>
                {list.length > 0 && (
                  <ul className="music-files">
                    {list.map((x) => (
                      <li key={x.id}>
                        <span className="music-file">{x.name}</span>
                        <button type="button" aria-label={t([`Remove ${x.name}`, `Quitar ${x.name}`])} onClick={() => remove(s, x.id)}>×</button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="music-slot-tools">
                  <label className="button-like">
                    {list.length ? t(['Add more', 'Añadir más']) : t(['Choose files', 'Elegir archivos'])}
                    <input type="file" accept="audio/*" multiple onChange={(e) => { add(s, e.target.files); e.target.value = ''; }} />
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </dialog>
  );
}
