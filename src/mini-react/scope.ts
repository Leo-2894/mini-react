import { isElement } from './types.js';
import type { DOMScope, Attrs, Tree, VNode } from './types.js';
// Optional DOM boundary: logical Tree attrs stay unchanged; only physical ID/IDREF
// attributes are scoped. Reads decode exact values written on that Node, never prefixes.
const reservations = new WeakMap<Document, { serial: number; ids: Set<string> }>();
export const IDREF_ATTRS = Object.freeze(['for', 'aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns', 'aria-flowto', 'aria-details', 'aria-errormessage', 'aria-activedescendant']);
const names = new Set(['id', ...IDREF_ATTRS]);
export function createDOMScope(host: HTMLElement): DOMScope {
  const document = host.ownerDocument;
  let registry = reservations.get(document);
  if (!registry) { registry = { serial: 0, ids: new Set<string>() }; reservations.set(document, registry); }
  const currentRegistry = registry;
  const ids = new Map<string, string>(), writes = new WeakMap<Element, Map<string, { logical: string; physical: string }>>();
  function physicalId(logical: string): string {
    let id = ids.get(logical);
    if (id === undefined) {
      do { id = `api-dom-${++currentRegistry.serial}`; } while (currentRegistry.ids.has(id) || document.getElementById(id));
      currentRegistry.ids.add(id); ids.set(logical, id);
    }
    return id;
  }
  function encode(name: string, value: string): string {
    if (name === 'id' || name === 'for') return physicalId(value);
    if (IDREF_ATTRS.includes(name)) return value.replace(/[^\t\n\f\r ]+/g, physicalId);
    return value;
  }
  const scope: DOMScope = {
    host,
    validateTree(tree: Tree) {
      const seen = new Set<string>();
      function visit(node: Tree | VNode): void {
        if (node.kind === 'element' && Object.hasOwn(node.attrs, 'id')) {
          const id = node.attrs.id;
          if (!/^[^\t\n\f\r ]+$/.test(id)) throw Error('ID must be nonempty and contain no ASCII whitespace');
          if (seen.has(id)) throw Error(`Duplicate logical ID: ${id}`);
          seen.add(id);
        }
        ('children' in node ? node.children : []).forEach(visit);
      }
      visit(tree);
    },
    readAttrs(node: Element) {
      const known = writes.get(node);
      return Object.fromEntries([...node.attributes].map(attr => {
        const record = known?.get(attr.name);
        return [attr.name, record && record.physical === attr.value ? record.logical : attr.value];
      }));
    },
    physicalAttrs(attrs: Attrs) { return Object.fromEntries(Object.entries(attrs).map(([name, value]) => [name, encode(name, value)])); },
    write(node: Element, name: string, value: string | null) {
      if (value === null) {
        if (node.hasAttribute(name)) node.removeAttribute(name);
        writes.get(node)?.delete(name);
        return;
      }
      const physical = encode(name, value);
      if (node.getAttribute(name) !== physical) node.setAttribute(name, physical);
      if (names.has(name)) {
        let known = writes.get(node);
        if (!known) { known = new Map(); writes.set(node, known); }
        known.set(name, { logical: value, physical });
      }
    },
    projectTree(tree: Tree) {
      scope.validateTree(tree);
      function visit(node: Node, vnode: VNode | Tree): void {
        if (vnode.kind === 'element') {
          if (!isElement(node)) throw Error('Expected projected element');
          for (const name of names) scope.write(node, name, Object.hasOwn(vnode.attrs, name) ? vnode.attrs[name] : null);
        }
        ('children' in vnode ? vnode.children : []).forEach((child, i) => visit(node.childNodes[i], child));
      }
      visit(host, tree);
    },
    querySelector(selector: string) {
      // Use the browser's CSS parser on a detached logical view. No selector rewriting,
      // live managed writes, or alternate renderer. Return the corresponding real Node.
      const view = host.cloneNode(true), originals = new WeakMap<Node, Node>();
      function visit(real: Node, mirror: Node): void {
        originals.set(mirror, real);
        if (isElement(real) && isElement(mirror)) {
          const attrs = scope.readAttrs(real);
          for (const name of names) if (Object.hasOwn(attrs, name)) mirror.setAttribute(name, attrs[name]);
        }
        [...real.childNodes].forEach((child, i) => visit(child, mirror.childNodes[i]));
      }
      visit(host, view);
      if (!isElement(view)) throw Error('Expected scope element');
      const found = view.querySelector(selector), real = found ? originals.get(found) : null;
      return isElement(real) ? real : null;
    }
  };
  return scope;
}
