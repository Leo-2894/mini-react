import { describe, it, expect } from 'vitest';
import { h, tree } from '../../src/mini-react/vnode.js';
import { readTree } from '../../src/mini-react/dom.js';
import { createPhase1 } from '../../src/phase1/controller.js';
import { createHistory } from '../../src/phase1/history.js';
import { validatePolicy, protectEditor } from '../../src/phase1/html-policy.js';
const t = value => tree(h('p', {}, value));
function setup() {
  const actual = document.createElement('div'), editor = document.createElement('div');
  actual.innerHTML = '<section data-key="s"><p data-key="p">S0</p><span data-key="stable">Stable</span></section>';
  const original = actual.firstChild;
  const app = createPhase1(actual, editor);
  return { actual, editor, app, original };
}
describe('H01~H03 Phase 1 and History', () => {
  it('clones initial DOM and patches the current edited DOM with identity preserved', () => {
    const { actual, editor, app, original } = setup(), p = actual.querySelector('p'), stable = actual.querySelector('span');
    expect(actual.firstChild).toBe(original); expect(editor.innerHTML).toBe(actual.innerHTML); expect(editor.firstChild).not.toBe(original);
    editor.querySelector('p').textContent = 'S1';
    expect(actual.querySelector('p').textContent).toBe('S0');
    app.apply(); expect(actual.querySelector('p').textContent).toBe('S1');
    expect(actual.querySelector('p')).toBe(p); expect(actual.querySelector('span')).toBe(stable);
    expect(app.history.cursor).toBe(1);
  });
  it('keeps no-op redo branch and discards it on a new real change', () => {
    const { actual, editor, app } = setup();
    for (const label of ['S1', 'S2']) { editor.querySelector('p').textContent = label; app.apply(); }
    app.travel(1); expect(editor.innerHTML).toBe(actual.innerHTML); expect(actual.textContent).toBe('S1Stable');
    expect(app.apply().changed).toBe(false); expect(app.history.entries).toHaveLength(3);
    app.travel(2); expect(actual.textContent).toBe('S2Stable');
    app.travel(1); editor.querySelector('p').textContent = 'S3'; app.apply();
    expect(app.history.entries).toHaveLength(3); expect(() => app.travel(3)).toThrow();
    expect(app.history.entries[2].tree.children[0].children[0].children[0].text).toBe('S3');
  });
  it('discards uncommitted structural drafts in Undo/Redo and restores current snapshot', () => {
    const { actual, editor, app } = setup(); editor.querySelector('p').textContent = 'S1'; app.apply();
    editor.firstChild.append(document.createElement('b')); editor.querySelector('p').remove();
    app.travel(0); expect(editor.innerHTML).toBe(actual.innerHTML); expect(editor.querySelector('p').textContent).toBe('S0');
    editor.firstChild.textContent = 'draft'; app.travel(1); expect(editor.querySelector('p').textContent).toBe('S1');
    editor.querySelector('p').textContent = 'unsaved'; app.restoreDraft(); expect(editor.innerHTML).toBe(actual.innerHTML); expect(app.history.cursor).toBe(1);
  });
  it('preflight failure preserves both DOMs and cursor', () => {
    const { actual, editor, app } = setup(); editor.querySelector('p').textContent = 'S1'; app.apply();
    actual.querySelector('span').setAttribute('title', 'external'); editor.querySelector('p').textContent = 'draft';
    const beforeActual = actual.innerHTML, beforeEdit = editor.innerHTML;
    expect(() => app.travel(0)).toThrow(/External/);
    expect(actual.innerHTML).toBe(beforeActual); expect(editor.innerHTML).toBe(beforeEdit); expect(app.history.cursor).toBe(1);
    expect(app.locked).toBe(false);
  });
  it('locks after an unexpected second-host apply error without moving the cursor', () => {
    const { actual, editor, app } = setup(); editor.querySelector('p').textContent = 'S1'; app.apply();
    editor.firstChild.replaceChildren(document.createElement('b'));
    editor.firstChild.insertBefore = () => { throw Error('simulated DOM failure'); };
    expect(() => app.travel(0)).toThrow(/simulated DOM failure/);
    expect(app.history.cursor).toBe(1); expect(app.locked).toBe(true);
    expect(actual.querySelector('p').textContent).toBe('S0');
    expect(() => app.apply()).toThrow(/잠겼습니다/);
  });
  it('freezes independent snapshots, bounds history at 50 and corrects the cursor', () => {
    const input = t('S0'), history = createHistory(input);
    input.children[0].children[0].text = 'mutated'; expect(history.current.tree.children[0].children[0].text).toBe('S0');
    for (let i = 1; i <= 55; i++) history.append(t('S' + i));
    expect(history.entries).toHaveLength(50); expect(history.cursor).toBe(49); expect(history.entries[0].id).toBe(6);
    expect(() => { history.current.tree.children[0].attrs.title = 'bad'; }).toThrow();
    expect(() => history.select(-1)).toThrow(); expect(() => createHistory(t(''), { limit: 0 })).toThrow();
  });
  it('does not append unsafe candidates or touch actual DOM', () => {
    const { actual, editor, app } = setup(), before = actual.innerHTML;
    editor.querySelector('p').setAttribute('onclick', 'bad()');
    expect(() => app.apply()).toThrow(); expect(actual.innerHTML).toBe(before); expect(app.history.entries).toHaveLength(1);
  });
});
describe('H04 safety policy', () => {
  it.each([
    () => h('script', {}, 'bad()'), () => h('iframe'), () => h('form'),
    () => h('p', { attrs: { href: 'https://example.com' } }),
    () => h('p', { attrs: { style: 'color:var(--x)' } }),
    () => h('p', { attrs: { style: 'background-color:url(x)' } }),
    () => h('p', { attrs: { style: 'position:absolute' } }),
    () => h('p', { attrs: { style: 'color:red!important' } }),
    () => h('p', { attrs: { style: 'color:no-such-color' } }),
    () => h('input', { attrs: { type: 'image' } }), () => h('button')
  ])('rejects unsafe/disallowed markup', create => expect(() => validatePolicy(tree(create()))).toThrow());
  it('allows safe class/style, boolean/ARIA and table/form markup', () => {
    expect(() => validatePolicy(tree(h('p', { attrs: { class: 'hello', style: 'color:red; margin:2px', 'aria-hidden': false } }, 'safe'), h('button', { attrs: { type: 'button' } }, 'Button'), h('input', { attrs: { type: 'checkbox', checked: true } })))).not.toThrow();
  });
  it('paste and drop insert only literal plain text, and teardown removes handlers', () => {
    const host = document.createElement('div'); document.body.append(host);
    const cleanup = protectEditor(host);
    for (const type of ['paste', 'drop']) {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, type === 'paste' ? 'clipboardData' : 'dataTransfer', { value: { getData: format => format === 'text/plain' ? '<img src=x onerror=bad()>' : '<script>bad()</script>' } });
      host.dispatchEvent(event); expect(event.defaultPrevented).toBe(true);
    }
    expect(host.querySelector('img,script')).toBeNull(); expect(host.textContent).toBe('<img src=x onerror=bad()>'.repeat(2));
    cleanup(); const event = new Event('paste', { cancelable: true }); host.dispatchEvent(event); expect(event.defaultPrevented).toBe(false);
  });
});
