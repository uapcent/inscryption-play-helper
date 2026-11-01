import { useEffect, useRef, useState } from 'react';
import { RULES_DATE } from './content';
import stones from './data/stones.json';
import { CardSheet } from './CardSheet';
import { CardsView } from './CardsView';
import { newGame, setStones, type Game } from './game';
import { SAVE_VERSION, readSave, type Saved } from './save';
import { useWakeLock, wakeLockSupported } from './wakeLock';
import { useInstall } from './install';
import {
  CardDraftScreen, CardsScreen, DeathScreen, DraftScreen, FirstScreen, FreshScreen, LimoncelloEndScreen, LimoncelloScreen, OverScreen, PickScreen, PlayScreen, PrepareScreen, RoundScreen, SetupScreen, type Move,
} from './screens';
import { MusicSheet } from './MusicSheet';
import { SettingsSheet } from './SettingsSheet';
import { loadTracks, music, slotFor, type Slot, type Track, type Tracks } from './music';
import { SigilsView } from './Sigils';
import { CardSheetContext, LangContext, LiteContext, defaultLite, noteLite, useMedia, type Lang } from './ui';

setStones(stones);

const SAVE_KEY = 'inscryption-helper:game';
const LANG_KEY = 'inscryption-helper:lang';
const LITE_KEY = 'inscryption-helper:lite';
const MUSIC_KEY = 'inscryption-helper:music';
const VOLUME_KEY = 'inscryption-helper:volume';
const AWAKE_KEY = 'inscryption-helper:awake';
const UNDO_LIMIT = 50;

function load(): Saved {
  let text: string | null = null;
  try { text = localStorage.getItem(SAVE_KEY); } catch { /* no storage: start fresh */ }
  return readSave(text);
}

function loadLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === '0' || saved === '1') return Number(saved) as Lang;
  } catch { /* no storage */ }
  return navigator.language.toLowerCase().startsWith('es') ? 1 : 0;
}

function loadLite() {
  try {
    const saved = localStorage.getItem(LITE_KEY);
    if (saved === '0' || saved === '1') return saved === '1';
  } catch { /* no storage */ }
  return defaultLite();
}

const loadSetting = (key: string) => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const saveSetting = (key: string, value: string) => {
  try { localStorage.setItem(key, value); } catch { /* it lasts until the page closes */ }
};

function GameView({ game, move, onNew }: { game: Game; move: Move; onNew: () => void }) {
  const props = { g: game, move };
  switch (game.phase.kind) {
    case 'setup': return <SetupScreen {...props} />;
    case 'cards': return <CardsScreen {...props} />;
    case 'prepare': return <PrepareScreen {...props} />;
    case 'draft': return <DraftScreen {...props} />;
    case 'first': return <FirstScreen {...props} />;
    case 'round': return <RoundScreen {...props} />;
    case 'death': return <DeathScreen {...props} />;
    case 'fresh': return <FreshScreen {...props} />;
    case 'cardDraft': return <CardDraftScreen {...props} />;
    case 'pick': return <PickScreen {...props} />;
    case 'play': return <PlayScreen {...props} />;
    case 'limoncello': return <LimoncelloScreen {...props} />;
    case 'limoncelloEnd': return <LimoncelloEndScreen {...props} />;
    case 'over': return <OverScreen {...props} onNew={onNew} />;
  }
}

export function App() {
  const [{ game, undo }, setSaved] = useState<Saved>(load);
  const [lang, setLang] = useState<Lang>(loadLang);
  const [tab, setTab] = useState<'game' | 'sigils' | 'cards'>('game');
  const [lite, setLiteState] = useState(loadLite);
  const [sheet, setSheet] = useState<string | null>(null);
  // On a big screen the sigils stay beside the game.
  const roomy = useMedia('(min-width: 1180px)');
  const sideSigils = roomy && tab === 'game';
  noteLite(lite);
  const setLite = (on: boolean) => {
    setLiteState(on);
    try { localStorage.setItem(LITE_KEY, on ? '1' : '0'); } catch { /* it lasts until the page closes */ }
  };
  const t = (en: string, es: string) => (lang === 1 ? es : en);

  // Music: off until someone turns it on, and only from the players' own files.
  const [musicOn, setMusicOnState] = useState(() => loadSetting(MUSIC_KEY) === '1');
  const [volume, setVolumeState] = useState(() => {
    const v = Number(loadSetting(VOLUME_KEY));
    return loadSetting(VOLUME_KEY) !== null && v >= 0 && v <= 1 ? v : 0.7;
  });
  const [tracks, setTracks] = useState<Tracks>({});
  const [musicSheet, setMusicSheet] = useState(false);
  const [settings, setSettings] = useState(false);
  const setMusicOn = (on: boolean) => { setMusicOnState(on); saveSetting(MUSIC_KEY, on ? '1' : '0'); music.setOn(on); };
  const setVolume = (v: number) => { setVolumeState(v); saveSetting(VOLUME_KEY, String(v)); music.setVolume(v); };
  const setSlot = (s: Slot, list: Track[]) => {
    const next = { ...tracks };
    if (list.length) next[s] = list; else delete next[s];
    setTracks(next);
    music.setTracks(next);
  };
  useEffect(() => {
    music.setVolume(volume);
    loadTracks().then((saved) => {
      setTracks(saved);
      music.setTracks(saved);
      music.setOn(musicOn);
    });
    // Browsers start sound only from a tap; any tap will do.
    const unlock = () => music.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
    // Once, at start-up: musicOn and volume are read from storage as they were.
  }, []);
  const slot = slotFor(game);
  useEffect(() => music.want(slot), [slot]);

  useEffect(() => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION, game, undo })); } catch { /* the game still works, unsaved */ }
  }, [game, undo]);
  useEffect(() => {
    try { localStorage.setItem(LANG_KEY, String(lang)); } catch { /* no storage */ }
    document.documentElement.lang = lang === 1 ? 'es' : 'en';
  }, [lang]);
  // Every step starts at the top of the page.
  const stepKey = `${game.round}:${game.phase.kind}:${game.phase.kind === 'play' ? game.phase.turn : ''}:${game.phase.kind === 'pick' ? game.phase.group : ''}`;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stepKey, tab]);
  useEffect(() => {
    document.documentElement.classList.toggle('lite', lite);
  }, [lite]);

  const move: Move = (f, { history = true } = {}) => setSaved((s) => {
    const next = f(s.game);
    if (next === s.game) return s;
    return { ...s, game: next, undo: history ? [...s.undo, s.game].slice(-UNDO_LIMIT) : s.undo };
  });
  // Undoing a step inside the same round keeps the scale where the players left it.
  const undoMove = () => setSaved((s) => {
    if (!s.undo.length) return s;
    const back = s.undo[s.undo.length - 1];
    const sameStep = back.round === s.game.round && back.phase.kind === s.game.phase.kind;
    return { ...s, game: sameStep ? { ...back, scale: s.game.scale, teeth: s.game.teeth } : back, undo: s.undo.slice(0, -1) };
  });
  const reset = () => setSaved({ version: SAVE_VERSION, game: newGame(), undo: [] });
  const confirmNew = () => {
    if (window.confirm(t('Abandon this game and start a new one?', '¿Abandonar esta partida y empezar otra?'))) reset();
  };
  const inGame = game.phase.kind !== 'setup';

  // What sticks under the top bar (the scale, the sigil search) needs its real height: it wraps
  // with long words, bigger text or another language.
  const topRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const top = topRef.current;
    if (!top || typeof ResizeObserver === 'undefined') return;
    const note = () => document.documentElement.style.setProperty('--top-h', `${Math.ceil(top.getBoundingClientRect().height)}px`);
    note();
    const watch = new ResizeObserver(note);
    watch.observe(top);
    return () => watch.disconnect();
  }, []);

  // During a game the phone stays awake: it sits on the table between taps.
  const [awake, setAwakeState] = useState(() => loadSetting(AWAKE_KEY) !== '0');
  const setAwake = (on: boolean) => { setAwakeState(on); saveSetting(AWAKE_KEY, on ? '1' : '0'); };
  useWakeLock(awake && inGame && game.phase.kind !== 'over');
  const install = useInstall();

  return (
    <LangContext.Provider value={lang}>
    <LiteContext.Provider value={{ lite, setLite }}>
    <CardSheetContext.Provider value={setSheet}>
      <header className="top" ref={topRef}>
        <span className="brand">Inscryption</span>
        <nav className="tabs" aria-label={t('Sections', 'Secciones')}>
          <button type="button" className={tab === 'game' ? 'on' : ''} onClick={() => setTab('game')}>{t('Game', 'Partida')}</button>
          <button type="button" className={tab === 'sigils' ? 'on' : ''} onClick={() => setTab('sigils')}>{t('Sigils', 'Sellos')}</button>
          <button type="button" className={tab === 'cards' ? 'on' : ''} onClick={() => setTab('cards')}>{t('Cards', 'Cartas')}</button>
        </nav>
        <div className="top-tools">
          {tab === 'game' && undo.length > 0 && <button type="button" aria-label={t('Undo', 'Deshacer')} onClick={undoMove}><span className="undo-word">{t('Undo', 'Deshacer')}</span><span className="undo-icon" aria-hidden="true">↶</span></button>}
          <button type="button" className="settings-button" aria-label={t('Settings', 'Ajustes')} onClick={() => setSettings(true)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="2.2" /><circle cx="12" cy="12" r="2.2" /><circle cx="19" cy="12" r="2.2" /></svg>
            {musicOn && <i className="music-dot" title={t('Music on', 'Música activada')} />}
          </button>
        </div>
      </header>
      <div className={`layout${sideSigils ? ' with-side' : ''}`}>
      <main className={`tab-${tab}`}>
        <div className="screen" key={tab === 'game' ? stepKey : tab}>
          {tab === 'game' && <GameView game={game} move={move} onNew={reset} />}
          {tab === 'sigils' && <SigilsView kaycee={game.kaycee} pelts={game.pelts} />}
          {tab === 'cards' && <CardsView kaycee={game.kaycee} pelts={game.pelts} />}
        </div>
      </main>
      {sideSigils && <aside className="side-sigils" aria-label={t('Sigils', 'Sellos')}><SigilsView kaycee={game.kaycee} pelts={game.pelts} /></aside>}
      </div>
      <footer>
        <div className="links">
        <button type="button" className="link" onClick={() => setSettings(true)}>{install.how ? t('Settings, and installing as an app', 'Ajustes, e instalar como app') : t('Settings', 'Ajustes')}</button>
        {inGame && tab === 'game' && game.phase.kind !== 'over' && <button type="button" className="link" onClick={confirmNew}>{t('Abandon this game', 'Abandonar esta partida')}</button>}
        </div>
        <p>
          {t('Unofficial fan-made helper. Rules modified from ', 'Ayuda no oficial hecha por un fan. Reglas modificadas a partir de las de ')}
          <a href="https://www.crypticcrafter.com" target="_blank" rel="noreferrer">CrypticCrafter</a>
          {t(', with house rules for Kaycee’s Mod. Inscryption and its art belong to Daniel Mullins Games.', ', con reglas de la casa para Kaycee’s Mod. Inscryption y su arte son de Daniel Mullins Games.')}
          {' '}{t(`Rules as of ${RULES_DATE}.`, `Reglas a ${RULES_DATE}.`)}
        </p>
      </footer>
      {settings && (
        <SettingsSheet
          lang={lang} setLang={setLang}
          musicOn={musicOn} setMusicOn={setMusicOn} trackCount={Object.values(tracks).reduce((n, l) => n + (l?.length ?? 0), 0)}
          openMusic={() => { setSettings(false); setMusicSheet(true); }}
          lite={lite} setLite={setLite}
          awake={awake} setAwake={setAwake} awakeSupported={wakeLockSupported}
          installHow={install.how} install={install.install}
          onClose={() => setSettings(false)}
        />
      )}
      {musicSheet && <MusicSheet on={musicOn} setOn={setMusicOn} volume={volume} setVolume={setVolume} tracks={tracks} setSlot={setSlot} onClose={() => setMusicSheet(false)} />}
      {sheet && <CardSheet key={sheet} id={sheet} kaycee={game.kaycee} onClose={() => setSheet(null)} />}
    </CardSheetContext.Provider>
    </LiteContext.Provider>
    </LangContext.Provider>
  );
}
