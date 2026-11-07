import { diff, equal, indexTree } from './diff.js';
import { createDOM, disposeDOM, syncEvents, syncProps, expectedAttrs } from './dom.js';
import { normalizeAttrs } from './vnode.js';
const applied = new WeakSet();
export function validatePatch(host, plan) {
  if (applied.has(plan)) throw Error('Plan already applied');
  if (!equal(diff(plan.oldTree, plan.nextTree).operations, plan.operations)) throw Error('Invalid patch operations');
  const records = indexTree(plan.oldTree), nodes = new Map([[0, host]]);
  function bind(record, node) {
    const v = record.vnode;
    if (!node) throw Error('External DOM change: missing node');
    if (v.kind === 'root') {
      if (node.childNodes.length !== record.children.length) throw Error('External DOM change: children');
    } else if (v.kind === 'text' || v.kind === 'comment') {
      if (node.nodeType !== (v.kind === 'text' ? 3 : 8) || node.data !== v.text) throw Error('External DOM change: text');
    } else {
      if (node.nodeType !== 1 || node.localName !== v.tag || node.namespaceURI !== 'http://www.w3.org/1999/xhtml' || node.getAttribute('data-key') !== v.key) throw Error('External DOM change: element/key');
      const attrs = Object.fromEntries([...node.attributes].filter(a => a.name !== 'data-key').map(a => [a.name, a.value]));
      if (!equal(normalizeAttrs(attrs), expectedAttrs(node, v.attrs)) || node.childNodes.length !== record.children.length) throw Error('External DOM change: attrs/children');
    }
    nodes.set(record.id, node);
    record.children.forEach((child, i) => bind(child, node.childNodes[i]));
  }
  bind(records[0], host);
  return { nodes, records };
}
export function patch(host, plan) {
  const { nodes } = validatePatch(host, plan);
  const fresh = new Map();
  // All new subtrees are prepared before the first write to the managed host.
  for (const op of plan.operations) if (op.type === 'CREATE') fresh.set(op.id, createDOM(op.subtree, host.ownerDocument));
  const resolve = ref => Object.hasOwn(ref, 'old') ? nodes.get(ref.old) : fresh.get(ref.fresh);
  const active = host.ownerDocument.activeElement;
  let selection;
  if (host.contains(active)) {
    try { if (typeof active.selectionStart === 'number') selection = [active.selectionStart, active.selectionEnd, active.selectionDirection]; } catch { /* input types without selection */ }
  }
  const removed = [];
  for (const op of plan.operations) {
    if (op.type === 'TEXT') resolve(op.target).data = op.text;
    if (op.type === 'ATTRS') {
      const node = resolve(op.target);
      op.remove.forEach(name => node.removeAttribute(name));
      Object.entries(op.set).forEach(([name, value]) => node.setAttribute(name, value));
    }
    if (op.type === 'EVENTS') syncEvents(resolve(op.target), op.next);
  }
  // diff emits each child's plan before its parent's plan (postorder).
  for (const op of plan.operations) if (op.type === 'CHILDREN') {
    const parent = resolve(op.parent), next = op.next.map(resolve), keep = new Set(next);
    for (const child of [...parent.childNodes]) if (!keep.has(child)) { parent.removeChild(child); removed.push(child); }
    let cursor = parent.firstChild;
    for (const child of next) {
      if (child === cursor) cursor = cursor.nextSibling;
      else parent.insertBefore(child, cursor);
    }
  }
  function control(node, vnode) {
    (vnode.children || []).forEach((child, i) => control(node.childNodes[i], child));
    if (vnode.kind === 'element') syncProps(node, vnode.props, vnode.attrs);
  }
  control(host, plan.nextTree);
  removed.forEach(disposeDOM);
  if (active && host.contains(active)) {
    if (host.ownerDocument.activeElement !== active) active.focus({ preventScroll: true });
    if (selection) {
      const max = active.value.length, [start, end, direction] = selection;
      if (active.selectionStart !== Math.min(start, max) || active.selectionEnd !== Math.min(end, max) || active.selectionDirection !== direction) active.setSelectionRange(Math.min(start, max), Math.min(end, max), direction);
    }
  }
  applied.add(plan);
  return { root: host, tree: plan.nextTree };
}
