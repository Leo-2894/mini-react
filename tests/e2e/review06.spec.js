import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => { await page.goto('/phase1/'); await expect(page.getByRole('status')).toBeVisible(); });
async function fixture(page, html) {
  await page.evaluate(async html => {
    const { createPhase1 } = await import('/src/phase1/controller.js');
    const actual = document.createElement('div'), editor = document.createElement('div'); actual.innerHTML = html;
    document.body.append(actual, editor); const original = actual.firstChild;
    window.fixture = { actual, editor, original, app: createPhase1(actual, editor) };
  }, html);
}
test('QA06-001 real browser reflected value, repeat render, type changes and external rejection', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { h, tree } = await import('/src/mini-react/vnode.js'); const { createRenderer } = await import('/src/mini-react/renderer.js');
    const host = document.createElement('div'); document.body.append(host); const renderer = createRenderer(host);
    const value = type => tree(h('input', { attrs: { type }, props: { value: '12', checked: true } }));
    renderer.render(value('checkbox')); const node = host.firstChild;
    const observer = new MutationObserver(() => {}); observer.observe(host, { subtree: true, attributes: true, childList: true });
    renderer.render(value('checkbox')); const writes = observer.takeRecords().length; observer.disconnect();
    for (const type of ['radio', 'text', 'checkbox', 'number', 'text']) { renderer.render(value(type)); renderer.render(value(type)); }
    node.setAttribute('value', 'external'); let rejects = false;
    try { renderer.render(value('text')); } catch (error) { rejects = /External/.test(error.message); }
    return { same: host.firstChild === node, writes, rejects };
  });
  expect(result).toEqual({ same: true, writes: 0, rejects: true });
});
test('QA06-002 checked radio cloning, independent editing, Patch and History in real browser', async ({ page }) => {
  await fixture(page, '<input data-key="a" type="radio" name="group" checked><input data-key="b" type="radio" name="group"><input data-key="c" type="radio" name="other" checked>');
  const initial = await page.evaluate(() => { const { actual, editor, original } = window.fixture; return { identity: actual.firstChild === original, actual: [...actual.children].map(n => n.checked), editor: [...editor.children].map(n => n.checked), separateForms: actual.firstChild.form !== editor.firstChild.form }; });
  expect(initial).toEqual({ identity: true, actual: [true, false, true], editor: [true, false, true], separateForms: true });
  const states = await page.evaluate(() => {
    const { actual, editor, app } = window.fixture, read = () => [[...actual.children].map(n => n.checked), [...editor.children].map(n => n.checked)];
    editor.children[1].click(); const draft = read(); app.apply(); const applied = read(); const snapshot = app.history.current.tree.children.map(node => node.props.checked);
    const noop = app.apply().changed; app.travel(0); const undo = read(); editor.children[1].click(); app.travel(1); const redo = read();
    return { draft, applied, snapshot, noop, undo, redo };
  });
  expect(states).toEqual({ draft: [[true, false, true], [false, true, true]], applied: [[false, true, true], [false, true, true]], snapshot: [false, true, true], noop: false, undo: [[true, false, true], [true, false, true]], redo: [[false, true, true], [false, true, true]] });
});
test('QA06-002 Inspector type/name radio then Patch keeps both areas checked', async ({ page }) => {
  await page.locator('#target').fill('input');
  for (const [name, value] of [['type', 'radio'], ['name', 'qa-ui-radio']]) {
    await page.locator('#attr-name').fill(name); await page.locator('#attr-value').fill(value); await page.getByRole('button', { name: '속성 설정', exact: true }).click();
  }
  await page.locator('#edit-host input').check(); await page.getByRole('button', { name: 'Patch 적용', exact: true }).click();
  await expect(page.locator('#actual-host input')).toBeChecked(); await expect(page.locator('#edit-host input')).toBeChecked();
  await page.getByRole('button', { name: 'Patch 적용', exact: true }).click(); await expect(page.getByRole('status')).toContainText('변경 없음');
});
test('QA06-003 explicit/implicit labels, text focus and keyboard activation remain local after History', async ({ page }) => {
  await fixture(page, '<label for="qa-box">Explicit<span> nested</span></label><input id="qa-box" type="checkbox"><label>Implicit<input type="checkbox"></label><label for="qa-text">Text focus</label><input id="qa-text" type="text">');
  const result = await page.evaluate(() => {
    const { actual, editor, app } = window.fixture;
    editor.querySelector('label span').click(); const explicit = [actual.querySelector('input').checked, editor.querySelector('input').checked];
    editor.querySelectorAll('label')[1].click(); const implicit = [actual.querySelectorAll('input')[1].checked, editor.querySelectorAll('input')[1].checked];
    editor.querySelectorAll('label')[2].click(); const textFocus = document.activeElement === editor.querySelectorAll('input')[2];
    app.apply(); app.travel(0); app.travel(1);
    editor.querySelector('label').click(); const afterHistory = [actual.querySelector('input').checked, editor.querySelector('input').checked];
    editor.querySelector('input').focus(); return { explicit, implicit, textFocus, afterHistory };
  });
  expect(result).toEqual({ explicit: [false, true], implicit: [false, true], textFocus: true, afterHistory: [true, false] });
  await page.keyboard.press('Space');
  expect(await page.evaluate(() => [window.fixture.actual.querySelector('input').checked, window.fixture.editor.querySelector('input').checked])).toEqual([true, true]);
});
test('QA06-004 every Inspector control id collision remains editable after Patch/Undo/Redo', async ({ page }) => {
  const inspector = page.locator('.inspector');
  for (const id of ['edit-text', 'target', 'attr-name', 'attr-value', 'tag']) {
    await inspector.locator('#attr-name').fill('id'); await inspector.locator('#attr-value').fill(id);
    await page.getByRole('button', { name: '속성 설정', exact: true }).click();
    await inspector.locator('#edit-text').fill('text-' + id); await page.getByRole('button', { name: '텍스트 변경', exact: true }).click();
    await expect(page.locator('#edit-host h3')).toHaveText('text-' + id);
    await page.getByRole('button', { name: 'Patch 적용', exact: true }).click(); await expect(page.locator('#actual-host h3')).toHaveText('text-' + id);
    await page.getByRole('button', { name: 'Undo', exact: true }).click(); await page.getByRole('button', { name: 'Redo', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
  }
});

test('QA06 combined Inspector ID collision then radio editing and repeated Patch', async ({ page }) => {
  const inspector = page.locator('.inspector');
  await inspector.locator('#attr-name').fill('id'); await inspector.locator('#attr-value').fill('edit-text'); await page.getByRole('button', { name: '속성 설정', exact: true }).click();
  await inspector.locator('#edit-text').fill('combined'); await page.getByRole('button', { name: '텍스트 변경', exact: true }).click(); await page.getByRole('button', { name: 'Patch 적용', exact: true }).click();
  await inspector.locator('#target').fill('input');
  for (const [name, value] of [['type', 'radio'], ['name', 'combined-radio']]) {
    await inspector.locator('#attr-name').fill(name); await inspector.locator('#attr-value').fill(value); await page.getByRole('button', { name: '속성 설정', exact: true }).click();
  }
  await page.locator('#edit-host input').check(); await page.getByRole('button', { name: 'Patch 적용', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0); await expect(page.locator('#actual-host input')).toBeChecked(); await expect(page.locator('#edit-host input')).toBeChecked();
});
