import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/**
 * Writes dist/sw.js from tools/service-worker.js, listing every file the site needs offline.
 * Its version is a hash of those files, so each deploy that changes something replaces the cache.
 */
function serviceWorker(): Plugin {
  let outDir = 'dist';
  return {
    name: 'service-worker',
    apply: 'build',
    configResolved(config) { outDir = config.build.outDir; },
    closeBundle() {
      const files: string[] = [];
      const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) walk(full);
          else files.push(path.relative(outDir, full).split(path.sep).join('/'));
        }
      };
      walk(outDir);
      // Every browser with a service worker reads woff2: the older .woff copies stay online only.
      const offline = files.filter((f) => f !== 'sw.js' && !f.endsWith('.woff') && !f.endsWith('.map')).sort();
      const template = fs.readFileSync('tools/service-worker.js', 'utf8');
      const hash = createHash('sha256').update(template);
      for (const f of offline) hash.update(f).update(fs.readFileSync(path.join(outDir, f)));
      const list = ['./', ...offline.filter((f) => f !== 'index.html')];
      const sw = template
        .replace('__VERSION__', hash.digest('hex').slice(0, 12))
        .replace('__FILES__', JSON.stringify(list));
      fs.writeFileSync(path.join(outDir, 'sw.js'), sw);
    },
  };
}

// BASE_PATH is set by the GitHub Pages workflow (e.g. "/inscryption-play-helper/").
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), serviceWorker()],
  server: { port: 5198, strictPort: true },
});
