import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('State lab batches three increments into one commit and retains the existing note input', async ({ page }) => {
  const note = page.getByRole('textbox', { name: '실습 메모' });
  await note.fill('메모는 남아야 함');
  await note.evaluate(node => { window.originalNote = node; });
  const revision = await page.evaluate(async () => (await import('/src/main.js')).root.renderer.revision);
  await page.getByRole('button', { name: '+3 묶기', exact: true }).click();
  await expect(page.getByTestId('count')).toHaveText('3');
  await expect(note).toHaveValue('메모는 남아야 함');
  expect(await note.evaluate(node => node === window.originalNote)).toBe(true);
  expect(await page.evaluate(async () => (await import('/src/main.js')).root.renderer.revision)).toBe(revision + 1);
  await page.getByRole('button', { name: /useMemo/ }).click();
  await page.getByRole('button', { name: /useState/ }).click();
  await expect(page.getByTestId('count')).toHaveText('3');
  await expect(note).toHaveValue('메모는 남아야 함');
  await page.getByRole('button', { name: '숫자 초기화' }).click();
  await expect(page.getByTestId('count')).toHaveText('0');
  await expect(note).toHaveValue('메모는 남아야 함');
});

test('Effect lab switches the actual event subscription and removes it on stop', async ({ page }) => {
  await page.getByRole('button', { name: /useEffect/ }).click();
  const received = page.getByTestId('received');
  const signal = channel => page.getByRole('button', { name: channel + ' 신호 보내기' }).click();
  await signal('A');
  await expect(received).toHaveText('0');
  await page.getByRole('button', { name: '구독 시작' }).click();
  await signal('B');
  await expect(received).toHaveText('0');
  await signal('A');
  await signal('A');
  await expect(received).toHaveText('2');
  await page.getByRole('button', { name: '채널 B' }).click();
  await signal('A');
  await expect(received).toHaveText('2');
  await signal('B');
  await expect(received).toHaveText('3');
  await page.getByRole('button', { name: '구독 멈추기' }).click();
  await signal('B');
  await expect(received).toHaveText('3');
});

test('Memo lab compares the actual cached object across view and quantity changes', async ({ page }) => {
  await page.getByRole('button', { name: /useMemo/ }).click();
  const comparison = page.getByTestId('memo-comparison');
  await expect(comparison).toHaveText('비교 기준 없음');
  await page.getByRole('button', { name: '기준 저장' }).click();
  await expect(comparison).toHaveText('같은 결과 재사용');
  await page.getByRole('button', { name: '보기 전환' }).click();
  await expect(page.getByText(/보기 B/)).toBeVisible();
  await expect(comparison).toHaveText('같은 결과 재사용');
  await expect(page.getByTestId('total')).toHaveText('1,000원');
  await page.getByRole('button', { name: '수량 +1' }).click();
  await expect(page.getByTestId('total')).toHaveText('2,000원');
  await expect(comparison).toHaveText('새 결과 계산');
  await page.getByRole('button', { name: '기준 저장' }).click();
  await expect(comparison).toHaveText('같은 결과 재사용');
});

test('Hook Lab remains usable on a narrow screen', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const hook of ['useState', 'useEffect', 'useMemo']) {
    await page.getByRole('button', { name: new RegExp(hook) }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  expect(errors).toEqual([]);
});
