import { afterEach, describe, it, expect } from 'vitest';
import { h, tree } from '../../src/mini-react/vnode.js';
import { createRenderer } from '../../src/mini-react/renderer.js';
import { createPhase1 } from '../../src/phase1/controller.js';
afterEach(() => { document.body.replaceChildren(); });
function setup() { const host = document.createElement('div'); document.body.append(host); return { host, renderer: createRenderer(host) }; }
function pair(markup) {
  const actual = document.createElement('div'), editor = document.createElement('div'); actual.innerHTML = markup; document.body.append(actual, editor);
  const original = actual.firstChild, app = createPhase1(actual, editor);
  return { actual, editor, original, app };
}
describe('QA06-001 reflected input value', () => {
  it.each(['checkbox', 'radio'])('repeated %s render preserves identity, reflected value and zero no-op writes', type => {
    const { host, renderer } = setup(); const value = tree(h('input', { attrs: { type }, props: { value: 'first', checked: true } }));
    renderer.render(value); const node = host.firstChild;
    expect(node.getAttribute('value')).toBe('first');
    const observer = new MutationObserver(() => {}); observer.observe(host, { attributes: true, childList: true, subtree: true });
    expect(() => renderer.render(value)).not.toThrow(); expect(host.firstChild).toBe(node);
    expect(observer.takeRecords()).toEqual([]); observer.disconnect();
    renderer.render(tree(h('input', { attrs: { type, value: 'default' }, props: { value: 'next', checked: false } })));
    expect(node.value).toBe('next'); expect(node.getAttribute('value')).toBe('next');
    expect(() => renderer.render(renderer.committedTree)).not.toThrow();
  });
  it('retains uncontrolled reflected value when removing props, and catches real external changes', () => {
    const { host, renderer } = setup();
    renderer.render(tree(h('input', { attrs: { type: 'checkbox' }, props: { value: 'controlled' } })));
    renderer.render(tree(h('input', { attrs: { type: 'checkbox' } })));
    expect(host.firstChild.value).toBe('controlled'); expect(() => renderer.render(renderer.committedTree)).not.toThrow();
    host.firstChild.setAttribute('value', 'outside');
    expect(() => renderer.render(renderer.committedTree)).toThrow(/External DOM change/);
  });
  it('still rejects a foreign empty style attribute with value projection active', () => {
    const { host, renderer } = setup(); const value = tree(h('input', { attrs: { type: 'checkbox' }, props: { value: 'first' } }));
    renderer.render(value); host.firstChild.setAttribute('style', '');
    expect(() => renderer.render(value)).toThrow(/External DOM change/);
  });
  it('supports default on/absent value, explicit removal, and repeated input type transitions', () => {
    const { host, renderer } = setup();
    renderer.render(tree(h('input', { attrs: { type: 'checkbox' } })));
    expect(host.firstChild.value).toBe('on'); expect(host.firstChild.hasAttribute('value')).toBe(false);
    renderer.render(renderer.committedTree);
    const node = host.firstChild;
    for (const type of ['text', 'checkbox', 'radio', 'number', 'text']) {
      const next = tree(h('input', { attrs: { type }, props: { value: '12', checked: false } }));
      renderer.render(next); expect(() => renderer.render(next)).not.toThrow(); expect(host.firstChild).toBe(node); expect(node.value).toBe('12');
    }
    renderer.render(tree(h('input', { attrs: { type: 'radio', value: 'x' } })));
    renderer.render(tree(h('input', { attrs: { type: 'radio' } })));
    expect(node.getAttribute('value')).toBeNull(); expect(node.value).toBe('on'); renderer.render(renderer.committedTree);
    node.setAttribute('title', 'external'); expect(() => renderer.render(renderer.committedTree)).toThrow(/External/);
  });
});
describe('QA06-002/003 Phase 1 boundaries', () => {
  it('initial checked radios retain source identity and both areas remain independently checked', () => {
    const { actual, editor, original, app } = pair('<input data-key="a" type="radio" name="same" checked><input data-key="b" type="radio" name="same">');
    expect(actual.firstChild).toBe(original); expect(actual.firstChild.checked).toBe(true); expect(editor.firstChild.checked).toBe(true);
    editor.lastChild.click(); expect(editor.lastChild.checked).toBe(true); expect(actual.firstChild.checked).toBe(true);
    app.apply(); expect(actual.lastChild.checked).toBe(true); expect(editor.lastChild.checked).toBe(true);
    expect(app.apply().changed).toBe(false);
    app.travel(0); expect(actual.firstChild.checked).toBe(true); expect(editor.firstChild.checked).toBe(true);
    app.travel(1); expect(actual.lastChild.checked).toBe(true); expect(editor.lastChild.checked).toBe(true);
  });
  it('explicit and implicit label activation stays in its area without changing logical id/for', () => {
    const { actual, editor, app } = pair('<label for="local-box">Explicit</label><input id="local-box" type="checkbox"><label>Implicit<input type="checkbox"></label>');
    editor.querySelector('label').click(); expect(actual.querySelector('input').checked).toBe(false); expect(editor.querySelector('input').checked).toBe(true);
    expect(editor.querySelector('input').id).toBe('local-box'); expect(editor.querySelector('label').htmlFor).toBe('local-box');
    editor.querySelectorAll('label')[1].click(); expect(actual.querySelectorAll('input')[1].checked).toBe(false); expect(editor.querySelectorAll('input')[1].checked).toBe(true);
    app.apply(); app.travel(0); app.travel(1);
    expect(actual.querySelector('input').checked).toBe(true); expect(editor.querySelector('input').checked).toBe(true);
  });
});
