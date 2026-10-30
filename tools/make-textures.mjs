// Writes the table's wood and the cards' paper to public/textures: procedural and tileable, no game files.
// Run with: node tools/make-textures.mjs
import fs from 'node:fs';
import sharp from 'sharp';

/** Seeded value noise that wraps every `period` lattice cells. */
function noise(seed) {
  const r = (i, j) => {
    const s = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const fade = (t) => t * t * (3 - 2 * t);
  return (x, y, px, py) => {
    const i = Math.floor(x), j = Math.floor(y);
    const u = fade(x - i), v = fade(y - j);
    const at = (a, b) => r(((a % px) + px) % px, ((b % py) + py) % py);
    const top = at(i, j) * (1 - u) + at(i + 1, j) * u;
    const bottom = at(i, j + 1) * (1 - u) + at(i + 1, j + 1) * u;
    return top * (1 - v) + bottom * v;
  };
}
const clamp = (v) => Math.max(0, Math.min(255, v));

async function write(name, size, pixel) {
  const buf = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x / size, y / size);
      const i = (y * size + x) * 3;
      buf[i] = clamp(r); buf[i + 1] = clamp(g); buf[i + 2] = clamp(b);
    }
  }
  fs.mkdirSync('public/textures', { recursive: true });
  await sharp(buf, { raw: { width: size, height: size, channels: 3 } }).webp({ quality: 72 }).toFile(`public/textures/${name}.webp`);
}

const n1 = noise(1), n2 = noise(2), n3 = noise(3), n4 = noise(4);

// Dark planks running left to right, with grain and a seam between them.
const PLANKS = 3;
await write('wood', 512, (u, v) => {
  const plank = Math.floor(v * PLANKS);
  const offset = plank * 0.37;
  const warp = n1((u + offset) * 3, v * 6, 3, 6) * 0.09;
  const rings = Math.sin((v + warp) * 150 + plank * 11);
  const fine = n2((u + offset) * 8, v * 96, 8, 96);
  const blotch = n3((u + offset) * 2, v * 3, 2, 3);
  const edge = Math.abs((v * PLANKS) % 1 - 0.5) * 2;
  const seam = edge > 0.975 ? 0.42 : 1;
  const tone = (0.62 + rings * 0.07 + fine * 0.3 + blotch * 0.16 + (plank % 2) * 0.05) * seam;
  return [62 * tone, 40 * tone, 25 * tone];
});

// The mat, in the colours of the printed board: dark red-brown wood with black scratches.
await write('mat', 512, (u, v) => {
  const warp = n1(u * 2, v * 4, 2, 4) * 0.14;
  const bands = n3(u * 3, (v + warp) * 14, 3, 14);
  const fine = n2(u * 12, v * 128, 12, 128);
  const scratch = n4(u * 3, v * 72, 3, 72) > 0.84 ? 0.35 : 1;
  const tone = (0.42 + bands * 0.75 + fine * 0.22) * scratch;
  return [72 * tone, 20 * tone, 8 * tone];
});

// Aged card paper: soft mottling and fine speckle.
await write('paper', 256, (u, v) => {
  const blotch = n3(u * 4, v * 4, 4, 4) * 0.6 + n1(u * 9, v * 9, 9, 9) * 0.4;
  const speck = n4(u * 128, v * 128, 128, 128);
  const fibre = n2(u * 24, v * 96, 24, 96);
  const tone = 0.93 + blotch * 0.07 + (speck - 0.5) * 0.045 + (fibre - 0.5) * 0.03;
  return [234 * tone, 214 * tone, 182 * tone];
});
