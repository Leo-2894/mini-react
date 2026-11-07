import { describe, it, expect, vi } from 'vitest';
import { h, tree, text, comment } from '../../src/mini-react/vnode.js';
import { diff } from '../../src/mini-react/diff.js';
import { patch } from '../../src/mini-react/patch.js';
import { createRenderer } from '../../src/mini-react/renderer.js';
import { readTree } from '../../src/mini-react/dom.js';
function setup(initial = tree()) {
  const host = document.createElement('div'); document.body.append(host);
  const renderer = createRenderer(host); renderer.render(initial);
  return { host, renderer };
}
const item = (key, value = key, tag = 'p') => h(tag, { key }, value);
describe('P01~P05 patch/renderer', () => {
  it('no-op has zero DOM writes and preserves every reference', () => {
    const initial = tree(h('section', {}, item('a'), 'x', comment('note')));
    const { host, renderer } = setup(initial), section = host.firstChild, child = section.firstChild;
    const observer = new MutationObserver(() => {}); observer.observe(host, { subtree: true, attributes: true, characterData: true, childList: true });
    renderer.render(initial);
    expect(observer.takeRecords()).toEqual([]);
    expect(host.firstChild).toBe(section); expect(section.firstChild).toBe(child);
    observer.disconnect();
  });
  it('updates text/attributes without replacing elements or siblings', () => {
    const { host, renderer } = setup(tree(h('p', { attrs: { class: 'a', title: 'x' } }, 'old'), item('stable')));
    const [p, stable] = host.childNodes, textNode = p.firstChild;
    renderer.render(tree(h('p', { attrs: { class: 'b', id: 'new' } }, 'new'), item('stable')));
    expect(host.firstChild).toBe(p); expect(p.firstChild).toBe(textNode); expect(host.lastChild).toBe(stable);
    expect(p.outerHTML).toBe('<p class="b" id="new">new</p>');
  });
  it('handles consecutive removal/insertion then last child removal', () => {
    const { host, renderer } = setup(tree(...'abcd'.split('').map(k => item(k))));
    const [a, b, c, d] = host.childNodes;
    renderer.render(tree(item('b'), item('e'), item('d')));
    expect([...host.childNodes].map(n => n.textContent)).toEqual(['b', 'e', 'd']);
    expect(host.firstChild).toBe(b); expect(host.lastChild).toBe(d); expect(a.isConnected || c.isConnected).toBe(false);
    renderer.render(tree()); expect(host.childNodes).toHaveLength(0);
    renderer.render(tree(item('z'))); expect(host.textContent).toBe('z');
  });
  it('applies descendant text changes to a moved parent and preserves it', () => {
    const { host, renderer } = setup(tree(h('section', { key: 'a' }, item('inner', 'old')), item('b')));
    const section = host.firstChild, inner = section.firstChild;
    renderer.render(tree(item('b'), h('section', { key: 'a' }, item('inner', 'new'))));
    expect(host.lastChild).toBe(section); expect(section.firstChild).toBe(inner); expect(inner.textContent).toBe('new');
  });
  it('replaces kinds/tags but never crosses parent identity', () => {
    const { host, renderer } = setup(tree(text('x'), item('a'))), old = host.lastChild;
    renderer.render(tree(h('b', {}, 'x'), item('a', 'a', 'span')));
    expect(host.firstChild.tagName).toBe('B'); expect(host.lastChild.tagName).toBe('SPAN'); expect(host.lastChild).not.toBe(old);
    renderer.render(tree('plain')); expect(host.firstChild.nodeType).toBe(3);
  });
  it('maintains event identity, changes/removes handlers and disposes removed subtrees', () => {
    const a = vi.fn(), b = vi.fn();
    const node = fn => tree(h('div', {}, h('button', { events: fn ? { click: fn } : {} }, 'Click')));
    const { host, renderer } = setup(node(a)), button = host.querySelector('button');
    const add = vi.spyOn(button, 'addEventListener'), remove = vi.spyOn(button, 'removeEventListener');
    renderer.render(node(a)); renderer.render(node(a)); button.click(); expect(a).toHaveBeenCalledTimes(1); expect(add).not.toHaveBeenCalled();
    renderer.render(node(b)); button.click(); expect(a).toHaveBeenCalledTimes(1); expect(b).toHaveBeenCalledTimes(1); expect(remove).toHaveBeenCalledTimes(1);
    renderer.render(node(null)); button.click(); expect(b).toHaveBeenCalledTimes(1);
    renderer.render(node(b)); renderer.render(tree()); button.click(); expect(b).toHaveBeenCalledTimes(1);
  });
  it('restores controlled live drift, avoids equal value writes, and keeps uncontrolled value', () => {
    const form = props => tree(h('input', { key: 'input', props }));
    const { host, renderer } = setup(form({ value: 'target' })), input = host.firstChild;
    const setter = vi.spyOn(input, 'value', 'set');
    renderer.render(form({ value: 'target' })); expect(setter).not.toHaveBeenCalled();
    input.value = 'drift'; setter.mockClear(); renderer.render(form({ value: 'target' }));
    expect(input.value).toBe('target'); expect(setter).toHaveBeenCalledTimes(1);
    renderer.render(form({})); expect(input.value).toBe('target');
  });
  it('updates select after options and textarea after children', () => {
    const form = value => tree(h('select', { props: { value } }, h('option', { attrs: { value: 'a' } }, 'A'), h('option', { attrs: { value: 'b' } }, 'B')), h('textarea', { props: { value } }, 'initial'));
    const { host, renderer } = setup(form('a')); renderer.render(form('b'));
    expect(host.children[0].value).toBe('b'); expect(host.children[1].value).toBe('b');
  });
  it('preserves focus/caret on keyed movement, clamps changed values', () => {
    const input = value => h('input', { key: 'i', props: { value } });
    const { host, renderer } = setup(tree(input('abcdef'), item('a'))), node = host.firstChild;
    node.focus(); node.setSelectionRange(2, 5, 'backward');
    renderer.render(tree(item('a'), input('abcdef')));
    expect(document.activeElement).toBe(node); expect([node.selectionStart, node.selectionEnd, node.selectionDirection]).toEqual([2, 5, 'backward']);
    renderer.render(tree(item('a'), input('x'))); expect(node.selectionStart).toBe(1); expect(node.selectionEnd).toBe(1);
  });
  it('rejects stale, foreign, replayed and external mutation before any writes', () => {
    const { host, renderer } = setup(tree(item('a'))), other = setup().renderer;
    const oldPlan = renderer.preview(tree(item('b')));
    expect(() => other.commit(oldPlan)).toThrow(/foreign/);
    renderer.render(tree(item('c')));
    expect(() => renderer.commit(oldPlan)).toThrow(/Stale/);
    const plan = renderer.preview(tree(item('d'))); host.firstChild.setAttribute('title', 'external');
    const before = host.innerHTML;
    expect(() => renderer.commit(plan)).toThrow(/External/); expect(host.innerHTML).toBe(before);
    host.firstChild.removeAttribute('title'); renderer.commit(plan);
    expect(() => renderer.commit(plan)).toThrow(/Stale/);
  });
  it('standalone patch rejects malformed ops and replay; editable adoption is explicit', () => {
    const { host } = setup(tree(item('a')));
    const plan = diff(readTree(host), tree(item('b')));
    expect(() => patch(host, { ...plan, operations: [] })).toThrow(/Invalid patch/);
    patch(host, plan); expect(() => patch(host, plan)).toThrow(/already/);
    const editor = createRenderer(host, { role: 'editable' }); host.firstChild.textContent = 'draft';
    editor.adoptEditedDOM(); editor.render(tree(item('saved'))); expect(host.textContent).toBe('saved');
    expect(() => createRenderer(host).adoptEditedDOM()).toThrow(/Only editable/);
    editor.destroy(); expect(() => editor.render(tree())).toThrow(/destroyed/);
  });
  it('covers every old/next combination in a small keyed list', () => {
    const variants = [[], ['a'], ['b', 'a'], ['a', 'b', 'c'], ['c', 'd', 'a']];
    for (const before of variants) for (const after of variants) {
      const { host, renderer } = setup(tree(...before.map(k => item(k))));
      const refs = new Map([...host.children].map(el => [el.dataset.key, el]));
      renderer.render(tree(...after.map(k => item(k, k + '!'))));
      expect([...host.children].map(el => el.textContent)).toEqual(after.map(k => k + '!'));
      for (const el of host.children) if (refs.has(el.dataset.key)) expect(el).toBe(refs.get(el.dataset.key));
      renderer.destroy(); host.remove();
    }
  });
});
