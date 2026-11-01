// Writes the app's home-screen icons to public/: a lit candle and a gold tooth on the dark table.
// Drawn here, no game files. Run with: node tools/make-app-icons.mjs
import sharp from 'sharp';

// Everything that matters sits in the middle 60%, so phones can crop it to any shape (maskable).
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="glow" cx="50%" cy="38%" r="62%">
      <stop offset="0" stop-color="#5a3518"/>
      <stop offset="0.45" stop-color="#2a1a0e"/>
      <stop offset="1" stop-color="#0d0805"/>
    </radialGradient>
    <radialGradient id="halo" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#ffb35a" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#ffb35a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="wax" x1="0" x2="1">
      <stop offset="0" stop-color="#f6ecd4"/><stop offset="0.75" stop-color="#d3bd90"/><stop offset="1" stop-color="#a68f62"/>
    </linearGradient>
    <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff6c8"/><stop offset="0.5" stop-color="#ffc04a"/><stop offset="1" stop-color="#e2641c"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff2b0"/><stop offset="0.45" stop-color="#e7b53c"/><stop offset="1" stop-color="#9a6a12"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#glow)"/>
  <circle cx="226" cy="168" r="120" fill="url(#halo)"/>
  <rect x="196" y="214" width="60" height="150" rx="6" fill="url(#wax)" stroke="#2a1a0c" stroke-width="5"/>
  <path d="M196 226c10 8 20 8 30 0s20-8 30 0" fill="none" stroke="#fff7e4" stroke-width="5" stroke-linecap="round"/>
  <path d="M226 214v-16" stroke="#1a0f08" stroke-width="5"/>
  <path d="M226 118c22 26 30 46 30 62a30 30 0 0 1-60 0c0-16 8-36 30-62z" fill="url(#flame)"/>
  <ellipse cx="226" cy="368" rx="54" ry="10" fill="#000" opacity="0.45"/>
  <g transform="translate(276 262) scale(4.4)">
    <path d="M3 3c4-3 10-3 14 0 2 5 0 9-1 13-1 4-2 7-3 7-2 0-2-7-3-7s-1 7-3 7c-1 0-2-3-3-7C3 12 1 8 3 3z" fill="url(#gold)" stroke="#3a2a18" stroke-width="1.1"/>
    <path d="M6 5c2-1 4-1 6 0" stroke="#fffbe6" stroke-width="1.1" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;

const out = [['app-icon-512.png', 512], ['app-icon-192.png', 192], ['apple-touch-icon.png', 180], ['favicon-32.png', 32]];
for (const [name, size] of out) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`public/${name}`);
  console.log(name);
}
