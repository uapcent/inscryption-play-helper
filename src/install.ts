import { useEffect, useState } from 'react';

interface InstallPrompt extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

/** True when the helper already runs as an installed app. */
const standalone = () =>
  matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** iPhones and iPads can install only from Safari's Share menu: they get a hint instead of a button. */
const appleMobile = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/**
 * How this browser can install the helper: 'prompt' (a button does it), 'apple' (Share, then Add
 * to Home Screen), or null (installed already, or the browser can't).
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
  const how: 'prompt' | 'apple' | null = installed ? null : prompt ? 'prompt' : appleMobile() ? 'apple' : null;
  const install = () => {
    prompt?.prompt().catch(() => {});
    prompt?.userChoice.then(() => setPrompt(null)).catch(() => {});
  };
  return { how, install };
}
