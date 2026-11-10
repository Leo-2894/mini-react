import { isElement, isCharacterData, isInput, isOption, isValueControl, errorMessage } from './types.js';
import type { Attrs, Events, FormProps, VNode, Tree, DOMScope } from './types.js';
import { h, text, comment, tree, validateVNode } from './vnode.js';
const listeners = new WeakMap<Node, Events>();
// input.value can reflect to a content attribute (checkbox/radio and type changes).
// Keep an exact physical value-attribute projection of our own writes, separately
// from the immutable logical attrs/props. External changes still compare exactly.
const inputValues = new WeakMap<Node, {logical: string | undefined; physical: string | null}>();
export function expectedAttrs(node: Element, attrs: Attrs): Attrs {
  const projection = inputValues.get(node);
  if (!projection || projection.logical !== attrs.value) return attrs;
  const expected = { ...attrs };
  if (projection.physical === null) delete expected.value;
  else expected.value = projection.physical;
  return expected;
}
export function syncEvents(node: Node, next: Events): void {
  const current = listeners.get(node) || {};
  for (const [type, fn] of Object.entries(current)) if (next[type] !== fn) node.removeEventListener(type, fn);
  for (const [type, fn] of Object.entries(next)) if (current[type] !== fn) node.addEventListener(type, fn);
  listeners.set(node, { ...next });
}
export function disposeDOM(node: Node): void {
  if (node.nodeType === 1) syncEvents(node, {});
  for (const child of node.childNodes) disposeDOM(child);
}
export function syncProps(node: Element, props: FormProps, attrs: Attrs = {}): void {
  for (const [name, value] of Object.entries(props)) {
    if (name === 'value' && isValueControl(node) && typeof value === 'string' && !Object.is(node.value, value)) node.value = value;
    if (name === 'checked' && isInput(node) && typeof value === 'boolean' && !Object.is(node.checked, value)) node.checked = value;
    if (name === 'selected' && isOption(node) && typeof value === 'boolean' && !Object.is(node.selected, value)) node.selected = value;
  }
  if (node.localName === 'input') inputValues.set(node, { logical: attrs.value, physical: node.getAttribute('value') });
}
export function readAttrs(node: Element, scope: DOMScope | null = null): Attrs {
  const attrs = scope ? scope.readAttrs(node) : Object.fromEntries([...node.attributes].map(attr => [attr.name, attr.value]));
  delete attrs['data-key'];
  return attrs;
}
export function setDOMAttribute(node: Element, name: string, value: string | null, scope: DOMScope | null = null): void {
  if (scope) scope.write(node, name, value);
  else if (value === null) node.removeAttribute(name);
  else node.setAttribute(name, value);
}
export function domToVNode(node: Node, scope: DOMScope | null = null): VNode {
  if (node.nodeType === 3 && isCharacterData(node)) return text(node.data);
  if (node.nodeType === 8 && isCharacterData(node)) return comment(node.data);
  if (!isElement(node) || node.namespaceURI !== 'http://www.w3.org/1999/xhtml') throw Error(`Unsupported DOM node at ${node.nodeName}`);
  const attrs = readAttrs(node, scope);
  const props: FormProps = {};
  const tag = node.localName;
  if (isValueControl(node)) props.value = node.value;
  if (isInput(node)) props.checked = node.checked;
  if (isOption(node)) props.selected = node.selected;
  try { return h(tag, { key: node.getAttribute('data-key'), attrs, props }, [...node.childNodes].map(child => domToVNode(child, scope))); }
  catch (error) { throw Error(`${node.nodeName}: ${errorMessage(error)}`); }
}
export function readTree(host: HTMLElement, scope: DOMScope | null = null): Tree { return tree([...host.childNodes].map(child => domToVNode(child, scope))); }
export function createDOM(vnode: VNode, document: Document = globalThis.document, scope: DOMScope | null = null): Node {
  validateVNode(vnode);
  if (vnode.kind === 'text') return document.createTextNode(vnode.text);
  if (vnode.kind === 'comment') return document.createComment(vnode.text);
  const node = document.createElement(vnode.tag);
  for (const [name, value] of Object.entries(vnode.attrs)) setDOMAttribute(node, name, value, scope);
  if (vnode.key != null) node.setAttribute('data-key', vnode.key);
  for (const child of vnode.children) node.appendChild(createDOM(child, document, scope));
  syncProps(node, vnode.props, vnode.attrs);
  syncEvents(node, vnode.events);
  return node;
}
