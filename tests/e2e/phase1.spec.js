import { test, expect } from '@playwright/test';
const actual = '#actual-host', editor = '#edit-host';
async function setText(page, value) {
  await page.locator('#edit-text').fill(value);
  await page.getByRole('button', { name: '텍스트 변경', exact: true }).click();
}
async function apply(page) { await page.getByRole('button', { name: 'Patch 적용', exact: true }).click(); }
async function sync(page) {
  // Independent DOM oracle: attribute order has no semantic meaning.
  const shapes = await page.evaluate(() => {
    function shape(node) {
      if (node.nodeType !== 1) return { type: node.nodeType, text: node.data };
      const live = {};
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(node.tagName)) live.value = node.value;
      if (node.tagName === 'INPUT') live.checked = node.checked;
      if (node.tagName === 'OPTION') live.selected = node.selected;
      return { tag: node.tagName, attrs: [...node.attributes].map(a => [a.name, a.value]).sort((a, b) => a[0].localeCompare(b[0])), live, children: [...node.childNodes].map(shape) };
    }
    return ['actual-host', 'edit-host'].map(id => [...document.getElementById(id).childNodes].map(shape));
  });
  expect(shapes[0]).toEqual(shapes[1]);
}
test.beforeEach(async ({ page }) => { await page.goto('/phase1/'); await expect(page.getByRole('status')).toContainText('초기 상태 S0'); });
test('H01 initial clone, direct DOM typing, partial patch and original identity', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await sync(page);
  await page.evaluate(() => { window.refs = { card: document.querySelector('#actual-host article'), heading: document.querySelector('#actual-host h3'), stable: document.querySelector('#actual-host ul') }; });
  await page.locator(editor + ' h3').fill('직접 편집한 제목');
  await expect(page.locator(actual + ' h3')).toHaveText('Hello, Mini React');
  await apply(page); await expect(page.locator(actual + ' h3')).toHaveText('직접 편집한 제목'); await sync(page);
  expect(await page.evaluate(() => window.refs.card === document.querySelector('#actual-host article') && window.refs.heading === document.querySelector('#actual-host h3') && window.refs.stable === document.querySelector('#actual-host ul'))).toBe(true);
  await expect(page.getByRole('button', { name: /^S1 ·/ })).toBeVisible(); expect(errors).toEqual([]);
});
test('H02 undo/redo, no-op preserves future, real branch discards it', async ({ page }) => {
  await setText(page, 'S1'); await apply(page); await setText(page, 'S2'); await apply(page);
  await page.getByRole('button', { name: 'Undo', exact: true }).click(); await expect(page.locator(actual + ' h3')).toHaveText('S1'); await sync(page);
  await apply(page); await expect(page.getByRole('status')).toContainText('변경 없음'); await expect(page.getByRole('button', { name: 'Redo', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Redo', exact: true }).click(); await expect(page.locator(actual + ' h3')).toHaveText('S2');
  await page.getByRole('button', { name: 'Undo', exact: true }).click(); await setText(page, 'S3'); await apply(page);
  await expect(page.getByRole('button', { name: 'Redo', exact: true })).toBeDisabled(); await expect(page.locator(actual + ' h3')).toHaveText('S3');
  await expect(page.getByRole('button', { name: /^S2 ·/ })).toHaveCount(0); await sync(page);
});
test('H03 initial button bounds, restore draft and history selection with structural draft', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled(); await expect(page.getByRole('button', { name: 'Redo', exact: true })).toBeDisabled();
  await setText(page, 'draft'); await page.getByRole('button', { name: '편집 되돌리기', exact: true }).click(); await sync(page);
  await setText(page, 'S1'); await apply(page);
  await page.locator('#target').fill('ul'); await page.locator('#tag').selectOption('li'); await page.locator('#edit-text').fill('draft child'); await page.getByRole('button', { name: '자식 추가', exact: true }).click();
  await expect(page.locator(editor + ' li')).toHaveCount(4);
  await page.getByRole('button', { name: /^S0 ·/ }).click(); await expect(page.locator(editor + ' li')).toHaveCount(3); await sync(page);
  await page.getByRole('button', { name: 'Redo', exact: true }).click(); await expect(page.locator(actual + ' h3')).toHaveText('S1'); await sync(page);
});
test('H01 all change types through inspector, safe style and attribute removal', async ({ page }) => {
  await page.locator('#attr-name').fill('title'); await page.locator('#attr-value').fill('added'); await page.getByRole('button', { name: '속성 설정', exact: true }).click(); await apply(page); await expect(page.locator(actual + ' h3')).toHaveAttribute('title', 'added');
  await page.locator('#attr-value').fill('changed'); await page.getByRole('button', { name: '속성 설정', exact: true }).click(); await apply(page); await expect(page.locator(actual + ' h3')).toHaveAttribute('title', 'changed');
  await page.getByRole('button', { name: '속성 삭제', exact: true }).click(); await apply(page); await expect(page.locator(actual + ' h3')).not.toHaveAttribute('title');
  await page.locator('#attr-name').fill('style'); await page.locator('#attr-value').fill('color: red; padding: 2px'); await page.getByRole('button', { name: '속성 설정', exact: true }).click(); await apply(page); await expect(page.locator(actual + ' h3')).toHaveCSS('color', 'rgb(255, 0, 0)');
  await page.locator('#target').fill('ul'); await page.locator('#tag').selectOption('li'); await page.locator('#edit-text').fill('new item'); await page.getByRole('button', { name: '자식 추가', exact: true }).click(); await apply(page); await expect(page.locator(actual + ' li')).toHaveCount(4);
  await page.locator('#target').fill('li:last-child'); await page.locator('#tag').selectOption('strong'); await page.getByRole('button', { name: '요소 교체', exact: true }).click(); await apply(page); await expect(page.locator(actual + ' ul > strong')).toHaveText('new item');
  await page.locator('#target').fill('ul > strong'); await page.getByRole('button', { name: '요소 삭제', exact: true }).click(); await apply(page); await expect(page.locator(actual + ' ul > strong')).toHaveCount(0); await sync(page);
});
test('H04 dangerous attributes/styles rejected before editable DOM insertion', async ({ page }) => {
  for (const [name, value] of [['onclick', 'window.bad=true'], ['href', 'javascript:alert(1)'], ['style', 'color:var(--bad)'], ['style', 'background-color:url(https://example.com/x)']]) {
    const before = await page.locator(editor).innerHTML();
    await page.locator('#attr-name').fill(name); await page.locator('#attr-value').fill(value); await page.getByRole('button', { name: '속성 설정', exact: true }).click();
    await expect(page.getByRole('alert')).toBeVisible(); expect(await page.locator(editor).innerHTML()).toBe(before);
  }
  expect(await page.evaluate(() => window.bad)).toBeUndefined();
});
test('H04 HTML paste/drop are plain text and cannot execute markup', async ({ page }) => {
  for (const type of ['paste', 'drop']) {
    await page.locator(editor).focus();
    await page.evaluate(type => {
      const transfer = new DataTransfer(); transfer.setData('text/plain', '<img src=x onerror=window.bad=true>'); transfer.setData('text/html', '<script>window.bad=true</script>');
      const event = type === 'paste' ? new ClipboardEvent('paste', { clipboardData: transfer, bubbles: true, cancelable: true }) : new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true });
      document.getElementById('edit-host').dispatchEvent(event);
    }, type);
  }
  await expect(page.locator(editor + ' script,' + editor + ' img')).toHaveCount(0); await apply(page);
  await expect(page.locator(actual)).toContainText('<img src=x onerror=window.bad=true>'); expect(await page.evaluate(() => window.bad)).toBeUndefined();
});
test('P04 real Chromium keyed move retains input focus/caret and no-op writes zero', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { h, tree } = await import('/src/mini-react/vnode.js'); const { createRenderer } = await import('/src/mini-react/renderer.js');
    const host = document.createElement('div'); document.body.append(host); const renderer = createRenderer(host);
    const input = value => h('input', { key: 'i', props: { value } }); const sibling = h('span', { key: 's' }, 'stable');
    renderer.render(tree(input('abcdef'), sibling)); const node = host.firstChild; node.focus(); node.setSelectionRange(2, 5, 'backward');
    renderer.render(tree(sibling, input('abcdef')));
    const focus = document.activeElement === node, selection = [node.selectionStart, node.selectionEnd, node.selectionDirection];
    const observer = new MutationObserver(() => {}); observer.observe(host, { childList: true, subtree: true, attributes: true, characterData: true });
    renderer.render(tree(sibling, input('abcdef'))); const writes = observer.takeRecords().length; observer.disconnect(); renderer.destroy(); host.remove();
    return { focus, selection, writes };
  });
  expect(result).toEqual({ focus: true, selection: [2, 5, 'backward'], writes: 0 });
});
test('mobile layout fits viewport and browser produces no errors', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.setViewportSize({ width: 390, height: 844 }); await page.reload();
  await expect(page.getByRole('status')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await setText(page, 'mobile'); await apply(page); await sync(page); expect(errors).toEqual([]);
});
