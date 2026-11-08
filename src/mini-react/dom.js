import { h, text, comment, tree, validateVNode } from './vnode.js';
const listeners = new WeakMap();
// input.value can reflect to a content attribute (checkbox/radio and type changes).
// Keep an exact physical value-attribute projection of our own writes, separately
// from the immutable logical attrs/props. External changes still compare exactly.
const inputValues = new WeakMap();
export function expectedAttrs(node, attrs) {
  const projection = inputValues.get(node);
  if (!projection || projection.logical !== attrs.value) return attrs;
  const expected = { ...attrs };
  if (projection.physical === null) delete expected.value;
  else expected.value = projection.physical;
  return expected;
}
export function syncEvents(node, next) {
  const current = listeners.get(node) || {};
  for (const [type, fn] of Object.entries(current)) if (next[type] !== fn) node.removeEventListener(type, fn);
  for (const [type, fn] of Object.entries(next)) if (current[type] !== fn) node.addEventListener(type, fn);
  listeners.set(node, { ...next });
}
export function disposeDOM(node) {
  if (node.nodeType === 1) syncEvents(node, {});
  for (const child of node.childNodes) disposeDOM(child);
}
export function syncProps(node, props, attrs = {}) {
  for (const [name, value] of Object.entries(props)) if (!Object.is(node[name], value)) node[name] = value;
  if (node.localName === 'input') inputValues.set(node, { logical: attrs.value, physical: node.getAttribute('value') });
}
export function readAttrs(node, scope = null) {
  const attrs = scope ? scope.readAttrs(node) : Object.fromEntries([...node.attributes].map(attr => [attr.name, attr.value]));
  delete attrs['data-key'];
  return attrs;
}
export function setDOMAttribute(node, name, value, scope = null) {
  if (scope) scope.write(node, name, value);
  else if (value === null) node.removeAttribute(name);
  else node.setAttribute(name, value);
}
export function domToVNode(node, scope = null) {
  if (node.nodeType === 3) return text(node.data);
  if (node.nodeType === 8) return comment(node.data);
  if (node.nodeType !== 1 || node.namespaceURI !== 'http://www.w3.org/1999/xhtml') throw Error(`Unsupported DOM node at ${node.nodeName}`);
  const attrs = readAttrs(node, scope);
  const props = {};
  const tag = node.localName;
  if (['input', 'textarea', 'select'].includes(tag)) props.value = node.value;
  if (tag === 'input') props.checked = node.checked;
  if (tag === 'option') props.selected = node.selected;
  try { return h(tag, { key: node.getAttribute('data-key'), attrs, props }, [...node.childNodes].map(child => domToVNode(child, scope))); }
  catch (error) { throw Error(`${node.nodeName}: ${error.message}`); }
}
export function readTree(host, scope = null) { return tree([...host.childNodes].map(child => domToVNode(child, scope))); }
export function createDOM(vnode, document = globalThis.document, scope = null) {
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
