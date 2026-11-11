import { test, expect } from '@playwright/test';

test('DOM Lab and Hook Lab link to each other and the shared flow chart', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Phase 1 DOM Lab' }).click();
  await expect(page.getByRole('heading', { name: '변경만 찾고, 필요한 곳만.' })).toBeVisible();
  await page.getByRole('link', { name: 'Phase 2 Hook Lab' }).click();
  await expect(page.getByRole('heading', { name: '버튼을 눌러 Hook을 배워요' })).toBeVisible();
  await page.getByRole('link', { name: '개념 흐름도', exact: true }).click();
  await expect(page.getByRole('heading', { name: '두 실습은 같은 엔진을 씁니다' })).toBeVisible();
});

test('static server serves the lab and blocks internal and removed routes', async ({ request }) => {
  expect((await request.get('/')).status()).toBe(200);
  expect((await request.get('/.git/config')).status()).toBe(404);
  expect((await request.get('/%2e%2e%2fpackage.json')).status()).toBe(404);
  expect((await request.get('/src/api/request.js')).status()).toBe(404);
  expect((await request.get('/src/components/panels.js')).status()).toBe(404);
});

test('DOM Lab reports the actual Diff commands and preserves the two-area History', async ({ page }) => {
  await page.goto('/phase1/');
  await page.getByRole('textbox', { name: '텍스트 / 새 요소 내용' }).fill('실습에서 바꾼 제목');
  await page.getByRole('button', { name: '텍스트 변경', exact: true }).click();
  const actualTitle = page.locator('#actual-host h3');
  const editTitle = page.locator('#edit-host h3');
  await expect(actualTitle).toHaveText('Hello, Mini React');
  await expect(editTitle).toHaveText('실습에서 바꾼 제목');
  await page.getByRole('button', { name: 'Patch 적용' }).click();
  await expect(actualTitle).toHaveText('실습에서 바꾼 제목');
  await expect(page.getByRole('region', { name: '최근 Patch 명령' })).toContainText('TEXT · 글자 바꾸기 · 1개');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(actualTitle).toHaveText('Hello, Mini React');
  await expect(editTitle).toHaveText('Hello, Mini React');
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(actualTitle).toHaveText('실습에서 바꾼 제목');
  await expect(editTitle).toHaveText('실습에서 바꾼 제목');
});
