/**
 * Plays a game through the screens like a person would, choosing whatever is first on offer.
 * It reads the step from the saved game, so it knows where it is without depending on texts.
 */
import { expect, type Page } from '@playwright/test';

export interface Options {
  kaycee: boolean;
  names: [string, string];
  /** Who loses each round, in order. */
  losers: (0 | 1)[];
}

type Phase = { kind: string; [k: string]: unknown };
interface SavedGame { game: { phase: Phase; round: number; lost: [number, number]; scale: number; prospector: unknown; teeth: unknown }; undo: unknown[] }

export const saved = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('inscryption-helper:game') ?? 'null') as unknown) as Promise<SavedGame>;

/** Fails the test on any error in the page. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  return errors;
}

/** Plays from the setup screen to the end. Returns the steps it went through, in order. */
export async function playGame(page: Page, o: Options): Promise<string[]> {
  const seen: string[] = [];
  let loser = 0;
  for (let i = 0; i < 400; i++) {
    const s = await saved(page);
    const kind = s?.game.phase.kind ?? 'setup';
    if (seen.at(-1) !== kind) seen.push(kind);
    if (kind === 'over') return seen;

    if (kind === 'setup') {
      const kaycee = page.getByRole('checkbox', { name: /^Kaycee/ });
      if ((await kaycee.isChecked()) !== o.kaycee) await kaycee.click();
      await page.locator('input[type=text], input:not([type])').nth(0).fill(o.names[0]);
      await page.locator('input[type=text], input:not([type])').nth(1).fill(o.names[1]);
      await page.locator('button.next').click();
    } else if (kind === 'round') {
      await playRound(page, s, o.losers[loser++] ?? 0);
    } else if (kind === 'limoncello') {
      // The ship hits one player's empty column once, then the fight ends.
      await page.locator('.scale-hit .hit').first().click();
      await page.locator('button.next').click();
    } else if (kind === 'pick') {
      const picks = (s.game.phase.picks as unknown[]).length;
      if (picks < 2) await page.locator('.choice:not(.selected):not([disabled])').first().click();
      else await page.locator('button.primary', { hasText: /Confirm|Confirmar/ }).click();
    } else if (kind === 'play') {
      await playEvent(page);
    } else if (kind === 'limoncelloEnd') {
      if (!s.game.phase.result) await page.locator('.choice').first().click();
      await page.locator('button.next').click();
    } else {
      // A step with only a Next button: cards, table, draft, coin, a lost life, the breaks.
      const next = page.locator('button.next');
      await expect(next).toBeEnabled({ timeout: 5000 });
      await next.click();
    }
    await page.waitForTimeout(50);
  }
  throw new Error(`The game didn't end: ${seen.join(' > ')}`);
}

/** A round: ready, the Prospector if he's there, then damage on the scale until someone loses. */
async function playRound(page: Page, s: SavedGame, loser: 0 | 1) {
  await page.locator('button', { hasText: /Ready: play|Listos: a jugar/ }).click();
  const mule = page.locator('.card', { hasText: /mule|mula/i }).locator('.row button');
  if (await mule.count()) {
    await mule.nth(loser === 0 ? 1 : 0).click();
    await page.locator('button.wide', { hasText: /Turn ended|Turno terminado/ }).click();
  }
  const undoBefore = (await saved(page)).undo.length;
  for (let n = 0; n < 5; n++) await page.locator('.scale-hits .hit').nth(loser).click();
  const after = await saved(page);
  expect(Math.abs(after.game.scale)).toBe(5);
  expect(after.undo.length, 'the scale stays out of Undo').toBe(undoBefore);
  await page.locator('.scale-bar button.danger').click();
  expect((await saved(page)).game.lost[loser]).toBe(s.game.lost[loser] + 1);
}

/** An event between rounds: pass the trials, take the first of everything, then Done. */
async function playEvent(page: Page) {
  for (let i = 0; i < 12; i++) {
    const done = page.locator('button.next');
    if (await done.isEnabled()) { await done.click(); return; }
    const passed = page.locator('button.ok', { hasText: /Passed|Superada/ });
    if (await passed.count()) { await passed.click(); continue; }
    // Each group of choices still without a pick gets its first one (a totem has two groups).
    const groups = page.locator('.choices');
    let picked = false;
    for (let g = 0; g < await groups.count(); g++) {
      const group = groups.nth(g);
      if (await group.locator('.choice.selected').count()) continue;
      const choice = group.locator('.choice:not([disabled])').first();
      if (await choice.count()) { await choice.click(); picked = true; break; }
    }
    if (!picked) await page.locator('.choice:not(.selected):not([disabled])').first().click();
    await page.waitForTimeout(100);
  }
  throw new Error('An event could not be finished');
}
