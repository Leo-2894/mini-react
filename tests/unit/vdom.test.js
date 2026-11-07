import { describe, it, expect } from 'vitest';
import { h, text, comment, tree, validateTree } from '../../src/mini-react/vnode.js';
import { readTree, domToVNode, createDOM } from '../../src/mini-react/dom.js';
const host = html => { const el = document.createElement('div'); el.innerHTML = html; return el; };
describe('D01/D02 DOM and VDOM', () => {
  it('reads independent literal shape and preserves original DOM references', () => {
    const el = host('<p class="greet">Hi &amp; <b>you</b><!--note--></p> ');
    const original = el.firstChild;
    expect(readTree(el)).toEqual({ kind: 'root', children: [{ kind: 'element', tag: 'p', key: null, attrs: { class: 'greet' }, props: {}, events: {}, children: [{ kind: 'text', text: 'Hi & ' }, { kind: 'element', tag: 'b', key: null, attrs: {}, props: {}, events: {}, children: [{ kind: 'text', text: 'you' }] }, { kind: 'comment', text: 'note' }] }, { kind: 'text', text: ' ' }] });
    const clone = document.createElement('div');
    readTree(el).children.forEach(v => clone.append(createDOM(v)));
    expect(readTree(clone)).toEqual(readTree(el));
    expect(el.firstChild).toBe(original);
    expect(clone.firstChild).not.toBe(original);
  });
  it('normalizes arrays, numbers and boolean/ARIA attrs, preserves empty text', () => {
    const node = h('DIV', { attrs: { hidden: true, disabled: false, 'aria-hidden': false, CLASS: 'a', style: 'color:red' } }, null, false, [0, ['', comment('x')]]);
    expect(node.attrs).toEqual({ hidden: '', 'aria-hidden': 'false', class: 'a', style: 'color:red' });
    expect(node.children).toEqual([text(0), text(''), comment('x')]);
    expect(createDOM(node).childNodes).toHaveLength(3);
  });
  it('reads live input/textarea/select values and restores them after children', () => {
    const el = host('<input type="checkbox" value="old"><textarea>old</textarea><select><option value="a">A</option><option value="b">B</option></select>');
    el.children[0].value = 'live'; el.children[0].checked = true;
    el.children[1].value = '<live&>'; el.children[2].value = 'b';
    const shape = readTree(el);
    expect(shape.children[0].props).toEqual({ value: 'live', checked: true });
    const clone = host(''); shape.children.forEach(v => clone.append(createDOM(v)));
    expect(clone.children[1].value).toBe('<live&>'); expect(clone.children[2].value).toBe('b');
    expect(readTree(clone)).toEqual(shape);
  });
  it('covers additional boolean attrs and rejects non-string styles', () => {
    expect(h('ol', { attrs: { reversed: false, inert: true } }).attrs).toEqual({ inert: '' });
    expect(() => h('p', { attrs: { style: { color: 'red' } } })).toThrow(/style must be a string/);
  });
  it('supports pure children and reserved round-trip keys', () => {
    const Child = ({ label }) => h('span', {}, label);
    const node = h(Child, { key: 'stable', label: 'Hello' });
    expect(domToVNode(createDOM(node))).toEqual(node);
    expect(h(() => null)).toBeNull();
    expect(() => tree(h('p', { key: 'x' }), h('p', { key: 'x' }))).toThrow(/Duplicate/);
  });
  it.each(['<template></template>', '<svg></svg>', '<my-element></my-element>', '<input type="file">', '<select multiple></select>', '<p onclick="bad()"></p>'])('rejects unsupported DOM: %s', markup => {
    expect(() => readTree(host(markup))).toThrow();
  });
  it('rejects invalid root, unsafe attributes/URLs and cyclic input', () => {
    expect(() => domToVNode(document)).toThrow(/Unsupported/);
    expect(() => h('p', { attrs: { 'data-key': 'x' } })).toThrow();
    expect(() => h('a', { attrs: { href: 'java\nscript:alert(1)' } })).toThrow();
    expect(() => h('p', { events: { click: 'bad' } })).toThrow();
    const node = h('p'); node.children.push(node);
    expect(() => validateTree({ kind: 'root', children: [node] })).toThrow(/cyclic/);
  });
  it('does not mutate frozen vnode inputs', () => {
    const node = h('p', {}, 'unchanged');
    Object.freeze(node.children); Object.freeze(node.attrs); Object.freeze(node);
    expect(createDOM(node).textContent).toBe('unchanged');
    expect(createDOM(h('p')).childNodes).toHaveLength(0);
  });
});
