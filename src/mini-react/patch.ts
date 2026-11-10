import { isElement, isCharacterData, isHTMLElement, isTextControl } from './types.js';
import type { DOMScope, PatchPlan, IndexedNode, Ref, VNode, Tree } from './types.js';
import { diff, equal, indexTree } from './diff.js';
import { createDOM, disposeDOM, syncEvents, syncProps, expectedAttrs, setDOMAttribute } from './dom.js';
import { normalizeAttrs } from './vnode.js';
const applied = new WeakSet<PatchPlan>();
export function validatePatch(host: HTMLElement, plan: PatchPlan, scope: DOMScope | null = null) {
  if (scope && scope.host !== host) throw Error('Foreign DOM scope');
  scope?.validateTree(plan.oldTree); scope?.validateTree(plan.nextTree);
  if (applied.has(plan)) throw Error('Plan already applied');
  if (!equal(diff(plan.oldTree, plan.nextTree).operations, plan.operations)) throw Error('Invalid patch operations');
  const records = indexTree(plan.oldTree), nodes = new Map<number, Node>([[0, host]]);
  function bind(record: IndexedNode, node: Node | undefined): void {
    const v = record.vnode;
    if (!node) throw Error('External DOM change: missing node');
    if (v.kind === 'root') {
      if (node.childNodes.length !== record.children.length) throw Error('External DOM change: children');
    } else if (v.kind === 'text' || v.kind === 'comment') {
      if (node.nodeType !== (v.kind === 'text' ? 3 : 8) || !isCharacterData(node) || node.data !== v.text) throw Error('External DOM change: text');
    } else {
      if (!isElement(node) || node.localName !== v.tag || node.namespaceURI !== 'http://www.w3.org/1999/xhtml' || node.getAttribute('data-key') !== v.key) throw Error('External DOM change: element/key');
      const attrs = Object.fromEntries([...node.attributes].filter(a => a.name !== 'data-key').map(a => [a.name, a.value]));
      if (!equal(normalizeAttrs(attrs), expectedAttrs(node, scope ? scope.physicalAttrs(v.attrs) : v.attrs)) || node.childNodes.length !== record.children.length) throw Error('External DOM change: attrs/children');
    }
    nodes.set(record.id, node);
    record.children.forEach((child, i) => bind(child, node.childNodes[i]));
  }
  bind(records[0], host);
  return { nodes, records };
}
export function patch(host: HTMLElement, plan: PatchPlan, scope: DOMScope | null = null) {
  const { nodes } = validatePatch(host, plan, scope);
  const fresh = new Map<number, Node>();
  // All new subtrees are prepared before the first write to the managed host.
  for (const op of plan.operations) if (op.type === 'CREATE') fresh.set(op.id, createDOM(op.subtree, host.ownerDocument, scope));
  const resolve = (ref: Ref): Node => {
    const node = ref.old !== undefined ? nodes.get(ref.old) : fresh.get(ref.fresh);
    if (!node) throw Error('Missing patch reference'); return node;
  };
  const active = host.ownerDocument.activeElement;
  let selection: [number, number, 'forward' | 'backward' | 'none'] | undefined;
  if (host.contains(active)) {
    try { if (isTextControl(active) && typeof active.selectionStart === 'number') selection = [active.selectionStart, active.selectionEnd ?? 0, active.selectionDirection ?? 'none']; } catch { /* input types without selection */ }
  }
  const removed: Node[] = [];
  for (const op of plan.operations) {
    if (op.type === 'TEXT') { const node = resolve(op.target); if (!isCharacterData(node)) throw Error('Expected text target'); node.data = op.text; }
    if (op.type === 'ATTRS') {
      const node = resolve(op.target);
      if (!isElement(node)) throw Error('Expected attribute target');
      op.remove.forEach(name => setDOMAttribute(node, name, null, scope));
      Object.entries(op.set).forEach(([name, value]) => setDOMAttribute(node, name, value, scope));
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
  function control(node: Node, vnode: VNode | Tree): void {
    ('children' in vnode ? vnode.children : []).forEach((child, i) => control(node.childNodes[i], child));
    if (vnode.kind === 'element') { if (!isElement(node)) throw Error('Expected controlled element'); syncProps(node, vnode.props, vnode.attrs); }
  }
  control(host, plan.nextTree);
  removed.forEach(disposeDOM);
  if (isHTMLElement(active) && host.contains(active)) {
    if (host.ownerDocument.activeElement !== active) active.focus({ preventScroll: true });
    if (selection && isTextControl(active)) {
      const max = active.value.length, [start, end, direction] = selection;
      if (active.selectionStart !== Math.min(start, max) || active.selectionEnd !== Math.min(end, max) || active.selectionDirection !== direction) active.setSelectionRange(Math.min(start, max), Math.min(end, max), direction);
    }
  }
  applied.add(plan);
  return { root: host, tree: plan.nextTree };
}
