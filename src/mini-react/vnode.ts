import { isRecord } from './types.js';
import type { Attrs, TextVNode, CommentVNode, VNode, Tree, ElementVNode, ElementOptions, Child } from './types.js';
import { withoutHooks } from './hooks.js';
const booleans = new Set('allowfullscreen async autofocus autoplay checked controls default defer disabled formnovalidate hidden inert ismap itemscope loop multiple muted nomodule novalidate open playsinline readonly required reversed selected'.split(' '));
const unsupported = new Set(['svg', 'math', 'template']);
export const text = (value: unknown): TextVNode => ({ kind: 'text', text: String(value) });
export const comment = (value: unknown): CommentVNode => ({ kind: 'comment', text: String(value) });
export function validateTag(tag: unknown): asserts tag is string {
  if (typeof tag !== 'string' || !/^[a-z][a-z0-9]*$/.test(tag) || unsupported.has(tag)) throw Error(`Unsupported HTML tag: ${tag}`);
}
export function normalizeAttrs(attrs: unknown = {}): Attrs {
  if (!isRecord(attrs)) throw Error('Invalid attrs');
  const result: Attrs = {};
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
export function normalizeChildren(values: readonly unknown[]): VNode[] {
  const flat: unknown[] = values.flat(Infinity);
  return flat.filter(v => v != null && typeof v !== 'boolean').map(v => {
    if (typeof v === 'string' || typeof v === 'number') return text(v);
    validateVNode(v); return v;
  });
}
export function h(tag: string, options?: ElementOptions | null, ...children: Child[]): ElementVNode;
export function h<P extends object>(tag: (props: P) => VNode | null, options: Omit<P, 'children'> & { key?: string | number | null }, ...children: Child[]): VNode | null;
export function h(tag: unknown, options: unknown = {}, ...children: unknown[]): VNode | null {
  options ??= {};
  if (!isRecord(options)) throw Error('Invalid element options');
  if (typeof tag === 'function') {
    const node: unknown = withoutHooks(() => tag({ ...options, children: normalizeChildren(children) }));
    if (node == null) return null;
    validateVNode(node);
    const result = options.key != null ? { ...node, key: String(options.key) } : node;
    validateVNode(result);
    return result;
  }
  const props = options.props ?? {}, events = options.events ?? {};
  if (!isRecord(props) || !isRecord(events)) throw Error('Invalid props/events');
  const node = { kind: 'element' as const, tag: String(tag).toLowerCase(), key: options.key == null ? null : String(options.key), attrs: normalizeAttrs(options.attrs), props: { ...props }, events: { ...events }, children: normalizeChildren(children) };
  validateVNode(node);
  return node;
}
export function tree(...children: Child[]): Tree {
  const result = { kind: 'root' as const, children: normalizeChildren(children) };
  validateTree(result);
  return result;
}
function validateChildren(children: unknown, ancestors: Set<unknown>): void {
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
export function validateVNode(node: unknown, ancestors = new Set<unknown>()): asserts node is VNode {
  if (!isRecord(node) || ancestors.has(node)) throw Error('Invalid/cyclic VNode');
  if (node.kind === 'text' || node.kind === 'comment') {
    if (typeof node.text !== 'string') throw Error('Invalid text');
    return;
  }
  if (node.kind !== 'element') throw Error('Invalid VNode kind');
  validateTag(node.tag);
  if (node.key !== null && typeof node.key !== 'string') throw Error('Invalid key');
  for (const name of ['attrs', 'props', 'events']) if (!isRecord(node[name]) || Array.isArray(node[name])) throw Error(`Invalid ${name}`);
  const attrs = node.attrs, props = node.props, events = node.events;
  if (!isRecord(attrs) || !isRecord(props) || !isRecord(events)) throw Error('Invalid VNode records');
  const normalized = normalizeAttrs(attrs);
  if (Object.keys(normalized).length !== Object.keys(attrs).length || Object.entries(attrs).some(([k, v]) => normalized[k] !== v)) throw Error('Noncanonical attrs');
  if (node.tag === 'input' && String(attrs.type || '').toLowerCase() === 'file') throw Error('Unsupported file input');
  if (node.tag === 'select' && 'multiple' in attrs) throw Error('Unsupported multiple select');
  for (const [name, value] of Object.entries(props)) {
    const allowed = name === 'value' ? ['input', 'textarea', 'select'].includes(node.tag) && typeof value === 'string' : name === 'checked' ? node.tag === 'input' && typeof value === 'boolean' : name === 'selected' && node.tag === 'option' && typeof value === 'boolean';
    if (!allowed) throw Error(`Unsupported property ${name} on ${node.tag}`);
  }
  for (const [name, fn] of Object.entries(events)) if (!/^[a-z]+$/.test(name) || typeof fn !== 'function') throw Error(`Invalid event ${name}`);
  const next = new Set(ancestors).add(node);
  validateChildren(node.children, next);
}
export function validateTree(value: unknown): asserts value is Tree {
  if (!isRecord(value) || value.kind !== 'root') throw Error('Expected root Tree');
  validateChildren(value.children, new Set([value]));
}
