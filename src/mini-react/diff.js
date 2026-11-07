import { validateTree } from './vnode.js';
export function equal(a, b) {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every(k => Object.hasOwn(b, k) && equal(a[k], b[k]));
}
export function clone(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(clone);
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clone(v)]));
}
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
export function indexTree(value) {
  const records = [];
  function visit(vnode, parent = null) {
    const record = { vnode, id: records.length, parent, children: [] };
    records.push(record);
    record.children = (vnode.children || []).map(child => visit(child, record.id));
    return record;
  }
  visit(value);
  return records;
}
export function diff(oldTree, nextTree) {
  validateTree(oldTree); validateTree(nextTree);
  const root = indexTree(oldTree)[0];
  const operations = [];
  let fresh = 0;
  function reconcile(previous, next, parent) {
    const keyed = new Map(previous.filter(r => r.vnode.key != null).map(r => [r.vnode.key, r]));
    const unkeyed = previous.filter(r => r.vnode.key == null);
    let index = 0;
    const refs = next.map(node => {
      const match = node.key != null ? keyed.get(node.key) : unkeyed[index++];
      if (!match || match.vnode.kind !== node.kind || (node.kind === 'element' && match.vnode.tag !== node.tag)) {
        const id = fresh++;
        operations.push({ type: 'CREATE', id, subtree: node });
        return { fresh: id };
      }
      const target = { old: match.id };
      if (node.kind === 'text' || node.kind === 'comment') {
        if (match.vnode.text !== node.text) operations.push({ type: 'TEXT', target, text: node.text });
      } else {
        const before = match.vnode;
        const set = Object.fromEntries(Object.entries(node.attrs).filter(([k, v]) => before.attrs[k] !== v));
        const remove = Object.keys(before.attrs).filter(k => !Object.hasOwn(node.attrs, k));
        if (Object.keys(set).length || remove.length) operations.push({ type: 'ATTRS', target, set, remove });
        if (!equal(before.events, node.events)) operations.push({ type: 'EVENTS', target, next: node.events });
        reconcile(match.children, node.children, target);
        if (!equal(before.props, node.props)) operations.push({ type: 'PROPS', target, next: node.props });
      }
      return target;
    });
    const prior = previous.map(r => ({ old: r.id }));
    if (!equal(prior, refs)) operations.push({ type: 'CHILDREN', parent, previous: prior, next: refs });
  }
  reconcile(root.children, nextTree.children, { old: 0 });
  // Plans own immutable structural copies, including function references (no JSON cloning).
  return freeze(clone({ oldTree, nextTree, operations }));
}
