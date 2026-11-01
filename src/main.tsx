import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import '@fontsource/alfa-slab-one/400.css';
import '@fontsource/spectral/400.css';
import '@fontsource/spectral/600.css';
import '@fontsource/spectral/700.css';
import './index.css';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

// The offline cache, in the built site only (it would get in the way while developing).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => { /* the site still works online */ });
  });
}
