import { expect, test } from '@playwright/test';
import { playGame, saved, watchErrors } from './play';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('inscryption-helper:lang', '0'); });
  await page.reload();
});

test('a base game, from setup to the death card', async ({ page }) => {
  const errors = watchErrors(page);
  const seen = await playGame(page, { kaycee: false, names: ['Ana', 'Bea'], losers: [0, 1, 0] });
  expect(seen).toEqual(['setup', 'cards', 'prepare', 'draft', 'first', 'round', 'death', 'round', 'death', 'round', 'over']);
  await expect(page.locator('h1')).toHaveText('Bea wins!');
  expect(errors).toEqual([]);
});

test('Kaycee’s Mod in Spanish and light mode: every break, the Prospector and the Limoncello', async ({ page }) => {
  const errors = watchErrors(page);
  await page.locator('button[aria-label="Settings"]').click();
  await page.locator('.segmented button', { hasText: 'Español' }).click();
  await page.locator('label.setting', { hasText: 'Modo ligero' }).click();
  await page.locator('.sheet-close').click();
  await expect(page.locator('html')).toHaveClass(/lite/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');

  const seen = await playGame(page, { kaycee: true, names: ['Ana', 'Bea'], losers: [0, 1, 0, 1, 0] });
  expect(seen).toContain('limoncello');
  expect(seen).toContain('pick');
  expect(seen).toContain('play');
  expect(seen.filter((k) => k === 'round')).toHaveLength(5);
  await expect(page.locator('h1')).toHaveText('¡Gana Bea!');
  expect((await saved(page)).game.lost).toEqual([3, 2]);
  expect(errors).toEqual([]);
});

test('a game in progress survives a reload, and Undo goes back a step', async ({ page }) => {
  await page.locator('button.next').click(); // start with the default setup
  await page.locator('button.next').click(); // the cards
  await expect(page.locator('button[aria-label="Undo"]')).toBeVisible();
  const before = (await saved(page)).game.phase.kind;
  await page.reload();
  expect((await saved(page)).game.phase.kind).toBe(before);
  await page.locator('button[aria-label="Undo"]').click();
  expect((await saved(page)).game.phase.kind).toBe('cards');
});
