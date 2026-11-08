// Optional DOM boundary: logical Tree attrs stay unchanged; only physical ID/IDREF
// attributes are scoped. Reads decode exact values written on that Node, never prefixes.
const reservations = new WeakMap();
export const IDREF_ATTRS = Object.freeze(['for', 'aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns', 'aria-flowto', 'aria-details', 'aria-errormessage', 'aria-activedescendant']);
const names = new Set(['id', ...IDREF_ATTRS]);
export function createDOMScope(host) {
  const document = host.ownerDocument;
  let registry = reservations.get(document);
  if (!registry) { registry = { serial: 0, ids: new Set() }; reservations.set(document, registry); }
  const ids = new Map(), writes = new WeakMap();
  function physicalId(logical) {
    if (!ids.has(logical)) {
      let id;
      do { id = `api-dom-${++registry.serial}`; } while (registry.ids.has(id) || document.getElementById(id));
      registry.ids.add(id); ids.set(logical, id);
    }
    return ids.get(logical);
  }
  function encode(name, value) {
    if (name === 'id' || name === 'for') return physicalId(value);
    if (IDREF_ATTRS.includes(name)) return value.replace(/[^\t\n\f\r ]+/g, physicalId);
    return value;
  }
  const scope = {
    host,
    validateTree(tree) {
      const seen = new Set();
      function visit(node) {
        if (node.kind === 'element' && Object.hasOwn(node.attrs, 'id')) {
          const id = node.attrs.id;
          if (!/^[^\t\n\f\r ]+$/.test(id)) throw Error('ID must be nonempty and contain no ASCII whitespace');
          if (seen.has(id)) throw Error(`Duplicate logical ID: ${id}`);
          seen.add(id);
        }
        (node.children || []).forEach(visit);
      }
      visit(tree);
    },
    readAttrs(node) {
      const known = writes.get(node);
      return Object.fromEntries([...node.attributes].map(attr => {
        const record = known?.get(attr.name);
        return [attr.name, record && record.physical === attr.value ? record.logical : attr.value];
      }));
    },
    physicalAttrs(attrs) { return Object.fromEntries(Object.entries(attrs).map(([name, value]) => [name, encode(name, value)])); },
    write(node, name, value) {
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
    projectTree(tree) {
      scope.validateTree(tree);
      function visit(node, vnode) {
        if (vnode.kind === 'element') for (const name of names) scope.write(node, name, Object.hasOwn(vnode.attrs, name) ? vnode.attrs[name] : null);
        (vnode.children || []).forEach((child, i) => visit(node.childNodes[i], child));
      }
      visit(host, tree);
    },
    querySelector(selector) {
      // Use the browser's CSS parser on a detached logical view. No selector rewriting,
      // live managed writes, or alternate renderer. Return the corresponding real Node.
      const view = host.cloneNode(true), originals = new WeakMap();
      function visit(real, mirror) {
        originals.set(mirror, real);
        if (real.nodeType === 1) {
          const attrs = scope.readAttrs(real);
          for (const name of names) if (Object.hasOwn(attrs, name)) mirror.setAttribute(name, attrs[name]);
        }
        [...real.childNodes].forEach((child, i) => visit(child, mirror.childNodes[i]));
      }
      visit(host, view);
      return originals.get(view.querySelector(selector)) || null;
    }
  };
  return scope;
}
