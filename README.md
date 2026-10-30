# Inscryption Play Helper

A phone-friendly helper for playing the Inscryption board game: it tells each player what to do between rounds,
reminds you of the rules during a round, and has a searchable list of sigils. English and Spanish.

Choose the expansions (base game, Kaycee's Mod, Pelts) and it walks you through the game: setup, the draft, each round,
the random events between rounds, the bosses, and the death card at the end. The game is saved in the browser and every
step can be undone. You still need the cards: the helper doesn't track the board or the scale.

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
| `src/data/sigils.json` | The sigil list |
| `public/icons/` | Sigil and event icons |

Pushing to `main` deploys to GitHub Pages (`.github/workflows/deploy.yml`; set Pages' source to GitHub Actions).
