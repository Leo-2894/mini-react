const booleans = new Set('allowfullscreen async autofocus autoplay checked controls default defer disabled formnovalidate hidden inert ismap itemscope loop multiple muted nomodule novalidate open playsinline readonly required reversed selected'.split(' '));
const unsupported = new Set(['svg', 'math', 'template']);
export const text = value => ({ kind: 'text', text: String(value) });
export const comment = value => ({ kind: 'comment', text: String(value) });
export function validateTag(tag) {
  if (typeof tag !== 'string' || !/^[a-z][a-z0-9]*$/.test(tag) || unsupported.has(tag)) throw Error(`Unsupported HTML tag: ${tag}`);
}
export function normalizeAttrs(attrs = {}) {
  const result = {};
  for (const [rawName, value] of Object.entries(attrs)) {
    const name = rawName.toLowerCase();
    if (name === 'style' && value != null && typeof value !== 'string') throw Error('style must be a string');
    if (!/^[a-z_:][a-z0-9_:.-]*$/.test(name) || name.startsWith('on') || name === 'srcdoc' || name === 'data-key') throw Error(`Unsafe/reserved attribute: ${name}`);
    if (value == null || (booleans.has(name) && value === false)) continue;
    if (['href', 'src', 'action', 'formaction', 'xlink:href'].includes(name) && /^[\s\u0000-\u0020]*(javascript|vbscript|data):/i.test(String(value).replace(/[\u0000-\u0020]/g, ''))) throw Error(`Unsafe URL: ${name}`);
    result[name] = booleans.has(name) ? '' : String(value);
  }
  return result;
}
export function normalizeChildren(values) {
  return values.flat(Infinity).filter(v => v != null && typeof v !== 'boolean').map(v => typeof v === 'string' || typeof v === 'number' ? text(v) : v);
}
export function h(tag, options = {}, ...children) {
  options ??= {};
  if (typeof tag === 'function') {
    const node = tag({ ...options, children: normalizeChildren(children) });
    if (node == null) return null;
    const result = options.key != null ? { ...node, key: String(options.key) } : node;
    validateVNode(result);
    return result;
  }
  const node = { kind: 'element', tag: String(tag).toLowerCase(), key: options.key == null ? null : String(options.key), attrs: normalizeAttrs(options.attrs), props: { ...options.props }, events: { ...options.events }, children: normalizeChildren(children) };
  validateVNode(node);
  return node;
}
export function tree(...children) {
  const result = { kind: 'root', children: normalizeChildren(children) };
  validateTree(result);
  return result;
}
function validateChildren(children, ancestors) {
  if (!Array.isArray(children)) throw Error('children must be an array');
  const keys = new Set();
  children.forEach(child => {
    validateVNode(child, ancestors);
    if (child.key != null) {
      if (keys.has(child.key)) throw Error(`Duplicate sibling key: ${child.key}`);
      keys.add(child.key);
    }
  });
}
export function validateVNode(node, ancestors = new Set()) {
  if (!node || ancestors.has(node)) throw Error('Invalid/cyclic VNode');
  if (node.kind === 'text' || node.kind === 'comment') {
    if (typeof node.text !== 'string') throw Error('Invalid text');
    return;
  }
  if (node.kind !== 'element') throw Error('Invalid VNode kind');
  validateTag(node.tag);
  if (node.key !== null && typeof node.key !== 'string') throw Error('Invalid key');
  for (const name of ['attrs', 'props', 'events']) if (!node[name] || typeof node[name] !== 'object' || Array.isArray(node[name])) throw Error(`Invalid ${name}`);
  const normalized = normalizeAttrs(node.attrs);
  if (Object.keys(normalized).length !== Object.keys(node.attrs).length || Object.entries(node.attrs).some(([k, v]) => normalized[k] !== v)) throw Error('Noncanonical attrs');
  if (node.tag === 'input' && (node.attrs.type || '').toLowerCase() === 'file') throw Error('Unsupported file input');
  if (node.tag === 'select' && 'multiple' in node.attrs) throw Error('Unsupported multiple select');
  for (const [name, value] of Object.entries(node.props)) {
    const allowed = name === 'value' ? ['input', 'textarea', 'select'].includes(node.tag) && typeof value === 'string' : name === 'checked' ? node.tag === 'input' && typeof value === 'boolean' : name === 'selected' && node.tag === 'option' && typeof value === 'boolean';
    if (!allowed) throw Error(`Unsupported property ${name} on ${node.tag}`);
  }
  for (const [name, fn] of Object.entries(node.events)) if (!/^[a-z]+$/.test(name) || typeof fn !== 'function') throw Error(`Invalid event ${name}`);
  const next = new Set(ancestors).add(node);
  validateChildren(node.children, next);
}
export function validateTree(value) {
  if (!value || value.kind !== 'root') throw Error('Expected root Tree');
  validateChildren(value.children, new Set([value]));
}
