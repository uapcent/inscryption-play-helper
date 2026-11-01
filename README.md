# Inscryption Play Helper

A phone-friendly helper for playing the Inscryption board game: it tells you which cards to use, shows the table in
pseudo-3D, tells each player what to do between rounds, reminds you of the rules during a round, and has a searchable
list of sigils. English and Spanish. It has a desktop layout, and a light mode without 3D or animations for slow phones.

Choose the expansions (base game, Kaycee's Mod, Pelts) and it walks you through the game: setup, the draft, each round,
the random events between rounds, the bosses, and the death card at the end. The game is saved in the browser and every
step can be undone. During a round it keeps the scale on screen: tap to move the gold tooth as damage lands, and it
tells you when someone draws an item or loses a life. You still need the cards: the helper doesn't track the board.

Music is optional and comes from the players' own files (the ♪ button), one or several for each moment: the cabin,
battles, the Prospector, the Limoncello and the end. With several, one is picked at random each time the moment
starts, and it loops. The files stay in the browser (IndexedDB) and are never uploaded; the site ships no music.

It installs as an app (Add to Home Screen) and works with no signal once it has been opened: a service worker keeps
every file of the site. During a game the screen stays on.

Unofficial and fan-made. The rules are a modified version of [CrypticCrafter's](https://www.crypticcrafter.com), with
house rules for Kaycee's Mod. Inscryption and its art belong to Daniel Mullins Games.

## Run

```bash
npm install
npm run dev     # http://localhost:5198
npm test
```

## Where things are

| Path | What |
|---|---|
| `src/game.ts` | The flow of a game, as pure functions (`tests/game.test.ts`) |
| `src/content.ts` | The rules' text, each as `[English, Spanish]`; `RULES_DATE` is shown on the page |
| `src/Screens.tsx` | One component per step |
| `src/Board.tsx` | The table in pseudo-3D (CSS transforms only) |
| `src/CardsView.tsx`, `src/data/cards.json` | Which cards to use, by back (names and copies only) |
| `tools/make-textures.mjs` | Generates the wood and paper textures |
| `src/data/sigils.json` | The sigil list |
| `src/save.ts` | Reading and upgrading the saved game (`tests/save.test.ts`) |
| `tools/service-worker.js`, `vite.config.ts` | The offline cache: the build lists every file and writes `sw.js` |
| `tools/make-app-icons.mjs` | Draws the home-screen icons |
| `src/music.ts`, `src/MusicSheet.tsx` | Which music each step plays, the player, and choosing the files (`tests/music.test.ts`) |
| `public/icons/` | Sigil and event icons |

Pushing to `main` deploys to GitHub Pages (`.github/workflows/deploy.yml`; set Pages' source to GitHub Actions).
