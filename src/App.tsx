import { useEffect, useState } from 'react';
import { RULES_DATE } from './content';
import stones from './data/stones.json';
import { CardSheet } from './CardSheet';
import { CardsView } from './CardsView';
import { newGame, setStones, type Game } from './game';
import {
  CardDraftScreen, CardsScreen, DeathScreen, DraftScreen, FirstScreen, FreshScreen, LimoncelloEndScreen, LimoncelloScreen, OverScreen, PickScreen, PlayScreen, PrepareScreen, RoundScreen, SetupScreen, type Move,
} from './Screens';
import { SigilsView } from './Sigils';
import { CardSheetContext, LangContext, LiteContext, defaultLite, noteLite, useMedia, type Lang } from './ui';

setStones(stones);

const SAVE_KEY = 'inscryption-helper:game';
const LANG_KEY = 'inscryption-helper:lang';
const LITE_KEY = 'inscryption-helper:lite';
const UNDO_LIMIT = 50;

interface Saved { game: Game; undo: Game[] }

function load(): Saved {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw) as Saved;
  } catch { /* no storage, or an old save: start fresh */ }
  return { game: newGame(), undo: [] };
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

  useEffect(() => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ game, undo })); } catch { /* the game still works, unsaved */ }
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

  const move: Move = (f) => setSaved((s) => {
    const next = f(s.game);
    return next === s.game ? s : { game: next, undo: [...s.undo, s.game].slice(-UNDO_LIMIT) };
  });
  const undoMove = () => setSaved((s) => (s.undo.length ? { game: s.undo[s.undo.length - 1], undo: s.undo.slice(0, -1) } : s));
  const reset = () => setSaved({ game: newGame(), undo: [] });
  const confirmNew = () => {
    if (window.confirm(t('Abandon this game and start a new one?', '¿Abandonar esta partida y empezar otra?'))) reset();
  };
  const inGame = game.phase.kind !== 'setup';

  return (
    <LangContext.Provider value={lang}>
    <LiteContext.Provider value={{ lite, setLite }}>
    <CardSheetContext.Provider value={setSheet}>
      <header className="top">
        <span className="brand">Inscryption</span>
        <nav className="tabs" aria-label={t('Sections', 'Secciones')}>
          <button type="button" className={tab === 'game' ? 'on' : ''} onClick={() => setTab('game')}>{t('Game', 'Partida')}</button>
          <button type="button" className={tab === 'sigils' ? 'on' : ''} onClick={() => setTab('sigils')}>{t('Sigils', 'Sellos')}</button>
          <button type="button" className={tab === 'cards' ? 'on' : ''} onClick={() => setTab('cards')}>{t('Cards', 'Cartas')}</button>
        </nav>
        <div className="top-tools">
          {tab === 'game' && undo.length > 0 && <button type="button" aria-label={t('Undo', 'Deshacer')} onClick={undoMove}><span className="undo-word">{t('Undo', 'Deshacer')}</span><span className="undo-icon" aria-hidden="true">↶</span></button>}
          <button type="button" aria-label={t('Cambiar a español', 'Switch to English')} onClick={() => setLang(lang === 1 ? 0 : 1)}>{lang === 1 ? 'EN' : 'ES'}</button>
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
        <button type="button" className="link" onClick={() => setLite(!lite)}>{lite ? t('Light mode: on. Turn off', 'Modo ligero: activado. Desactivar') : t('Light mode: off. Turn on', 'Modo ligero: desactivado. Activar')}</button>
        {inGame && tab === 'game' && game.phase.kind !== 'over' && <button type="button" className="link" onClick={confirmNew}>{t('Abandon this game', 'Abandonar esta partida')}</button>}
        <p>
          {t('Unofficial fan-made helper. Rules modified from ', 'Ayuda no oficial hecha por un fan. Reglas modificadas a partir de las de ')}
          <a href="https://www.crypticcrafter.com" target="_blank" rel="noreferrer">CrypticCrafter</a>
          {t(', with house rules for Kaycee’s Mod. Inscryption and its art belong to Daniel Mullins Games.', ', con reglas de la casa para Kaycee’s Mod. Inscryption y su arte son de Daniel Mullins Games.')}
          {' '}{t(`Rules as of ${RULES_DATE}.`, `Reglas a ${RULES_DATE}.`)}
        </p>
      </footer>
      {sheet && <CardSheet key={sheet} id={sheet} kaycee={game.kaycee} onClose={() => setSheet(null)} />}
    </CardSheetContext.Provider>
    </LiteContext.Provider>
    </LangContext.Provider>
  );
}
