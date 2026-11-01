import { expect, test } from '@playwright/test';
import { watchErrors } from './play';

test('after one visit it works with no signal', async ({ page, context }) => {
  const errors = watchErrors(page);
  await page.goto('./');
  await page.evaluate(() => navigator.serviceWorker.ready);
  // Wait until the service worker has the whole site.
  await expect.poll(() => page.evaluate(async () => {
    const keys = await caches.keys();
    return keys.length ? (await (await caches.open(keys[0])).keys()).length : 0;
  }), { timeout: 30_000 }).toBeGreaterThan(100);

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('h1')).toBeVisible();
  await page.locator('nav button').nth(2).click(); // the card list, full of pictures
  const broken = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src));
  expect(broken).toEqual([]);
  expect(errors).toEqual([]);
});

test('the app manifest and its icons are there', async ({ page, request }) => {
  await page.goto('./');
  const href = await page.locator('link[rel=manifest]').getAttribute('href');
  const manifest = await (await request.get(href!)).json();
  expect(manifest.display).toBe('standalone');
  for (const icon of manifest.icons) {
    const res = await request.get(new URL(icon.src, new URL(href!, page.url())).href);
    expect(res.ok(), icon.src).toBe(true);
  }
});
