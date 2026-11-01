import { useEffect, useState } from 'react';

interface InstallPrompt extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

/** True when the helper already runs as an installed app. */
const standalone = () =>
  matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** iPhones and iPads can install only from Safari's Share menu: they get a hint instead of a button. */
const appleMobile = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const firefoxAndroid = () => /android/i.test(navigator.userAgent) && /firefox|fxios/i.test(navigator.userAgent);
const android = () => /android/i.test(navigator.userAgent);

export type InstallHow = 'prompt' | 'apple' | 'firefox' | 'menu' | null;

/**
 * How this browser can install the helper: 'prompt' (a button does it), 'apple' (Share, then Add
 * to Home Screen), 'firefox' (Firefox on Android: its menu), 'menu' (another phone browser's
 * menu), or null (installed already, or a computer browser that can't).
 */
export function useInstall() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(standalone);
  useEffect(() => {
    const offer = (e: Event) => { e.preventDefault(); setPrompt(e as InstallPrompt); };
    const done = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener('beforeinstallprompt', offer);
    window.addEventListener('appinstalled', done);
    return () => { window.removeEventListener('beforeinstallprompt', offer); window.removeEventListener('appinstalled', done); };
  }, []);
  const how: InstallHow = installed ? null
    : prompt ? 'prompt'
    : appleMobile() ? 'apple'
    : firefoxAndroid() ? 'firefox'
    : android() ? 'menu'
    : null;
  const install = () => {
    prompt?.prompt().catch(() => {});
    prompt?.userChoice.then(() => setPrompt(null)).catch(() => {});
  };
  return { how, install };
}
