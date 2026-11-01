import { useEffect, useRef } from 'react';
import type { InstallHow } from './install';
import { useT, type Lang } from './ui';

/** A setting that is on or off: a checkbox with its name and what it does. */
function Switch({ on, set, title, text }: { on: boolean; set: (on: boolean) => void; title: string; text: string }) {
  return (
    <label className="toggle setting">
      <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} />
      <span><b>{title}</b><small>{text}</small></span>
    </label>
  );
}

/**
 * Everything that isn't the game: language, music, light mode, keeping the screen on, and how to
 * install the helper on this phone.
 */
export function SettingsSheet(props: {
  lang: Lang; setLang: (l: Lang) => void;
  musicOn: boolean; setMusicOn: (on: boolean) => void; trackCount: number; openMusic: () => void;
  lite: boolean; setLite: (on: boolean) => void;
  awake: boolean; setAwake: (on: boolean) => void; awakeSupported: boolean;
  installHow: InstallHow; install: () => void;
  onClose: () => void;
}) {
  const t = useT();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  const close = () => ref.current?.close();
  const steps: Record<Exclude<InstallHow, 'prompt' | null>, [string, string]> = {
    apple: ['In Safari, tap Share, then Add to Home Screen.', 'En Safari, pulsa Compartir y luego Añadir a pantalla de inicio.'],
    firefox: ['Open Firefox’s ⋮ menu and tap Add app to Home screen (or Install).', 'Abre el menú ⋮ de Firefox y pulsa Añadir app a la pantalla de inicio (o Instalar).'],
    menu: ['Open your browser’s menu and look for Install app or Add to Home screen.', 'Abre el menú del navegador y busca Instalar app o Añadir a pantalla de inicio.'],
  };

  return (
    <dialog ref={ref} className="sheet settings" onClose={props.onClose} onClick={(e) => { if (e.target === ref.current) close(); }}>
      <div className="sheet-body">
        <button type="button" className="sheet-close" aria-label={t(['Close', 'Cerrar'])} onClick={close}>×</button>
        <h2 className="sheet-title">{t(['Settings', 'Ajustes'])}</h2>

        <section className="settings-group">
          <h3>{t(['Language', 'Idioma'])}</h3>
          <div className="segmented" role="group" aria-label={t(['Language', 'Idioma'])}>
            <button type="button" aria-pressed={props.lang === 0} className={props.lang === 0 ? 'on' : ''} onClick={() => props.setLang(0)}>English</button>
            <button type="button" aria-pressed={props.lang === 1} className={props.lang === 1 ? 'on' : ''} onClick={() => props.setLang(1)}>Español</button>
          </div>
        </section>

        <section className="settings-group">
          <h3>{t(['Music', 'Música'])}</h3>
          <Switch
            on={props.musicOn}
            set={props.setMusicOn}
            title={t(['Play music', 'Poner música'])}
            text={props.trackCount
              ? t([`${props.trackCount} of your files, a different one for each moment of the game.`, `${props.trackCount} de tus archivos, distintos para cada momento de la partida.`])
              : t(['No music chosen yet: choose your own files below.', 'Aún no hay música: elige tus propios archivos abajo.'])}
          />
          <button type="button" onClick={props.openMusic}>{t(['Choose music…', 'Elegir música…'])}</button>
        </section>

        <section className="settings-group">
          <h3>{t(['On this phone', 'En este móvil'])}</h3>
          <Switch on={props.lite} set={props.setLite} title={t(['Light mode', 'Modo ligero'])} text={t(['A flat board and no animations, for phones that lag.', 'Tablero plano y sin animaciones, para móviles que van lentos.'])} />
          {props.awakeSupported && (
            <Switch on={props.awake} set={props.setAwake} title={t(['Keep the screen on', 'Mantener la pantalla encendida'])} text={t(['During a game, the screen doesn’t dim or lock.', 'Durante la partida, la pantalla no se oscurece ni se bloquea.'])} />
          )}
        </section>

        {props.installHow && (
          <section className="settings-group">
            <h3>{t(['Install as an app', 'Instalar como app'])}</h3>
            <p className="note">{t(['It gets its own icon, opens full screen and works with no signal.', 'Tendrá su propio icono, se abrirá a pantalla completa y funcionará sin cobertura.'])}</p>
            {props.installHow === 'prompt'
              ? <button type="button" className="primary" onClick={props.install}>{t(['Install', 'Instalar'])}</button>
              : <p className="install-hint">{t(steps[props.installHow])}</p>}
          </section>
        )}
      </div>
    </dialog>
  );
}
