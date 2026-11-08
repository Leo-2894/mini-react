export type Attrs = Record<string, string>;
export type AttrInput = Record<string, unknown>;
export interface FormProps { value?: string; checked?: boolean; selected?: boolean }
export type Events = Record<string, EventListener>;
export interface TextVNode { kind: 'text'; text: string; key?: string | null }
export interface CommentVNode { kind: 'comment'; text: string; key?: string | null }
export interface ElementVNode {
  kind: 'element'; tag: string; key: string | null;
  attrs: Attrs; props: FormProps; events: Events; children: VNode[];
}
export type VNode = TextVNode | CommentVNode | ElementVNode;
export interface Tree { kind: 'root'; children: VNode[]; key?: never }
export type Container = Tree | ElementVNode;
export type Child = VNode | string | number | boolean | null | undefined | readonly Child[];
export interface ElementOptions { key?: string | number | null; attrs?: AttrInput; props?: FormProps; events?: Events }
export type Ref = { old: number; fresh?: never } | { fresh: number; old?: never };
export type Operation =
  | { type: 'CREATE'; id: number; subtree: VNode }
  | { type: 'TEXT'; target: Ref; text: string }
  | { type: 'ATTRS'; target: Ref; set: Attrs; remove: string[] }
  | { type: 'EVENTS'; target: Ref; next: Events }
  | { type: 'CHILDREN'; parent: Ref; previous: Ref[]; next: Ref[] }
  | { type: 'PROPS'; target: Ref; next: FormProps };
export interface PatchPlan { oldTree: Tree; nextTree: Tree; operations: Operation[] }
export interface RenderPlan extends PatchPlan { rendererId: symbol; baseRevision: number }
export interface IndexedNode { vnode: VNode | Tree; id: number; parent: number | null; children: IndexedNode[] }
export interface DOMScope {
  host: HTMLElement;
  validateTree(tree: Tree): void;
  readAttrs(node: Element): Attrs;
  physicalAttrs(attrs: Attrs): Attrs;
  write(node: Element, name: string, value: string | null): void;
  projectTree(tree: Tree): void;
  querySelector(selector: string): Element | null;
}
export interface Renderer {
  readonly committedTree: Tree; readonly revision: number;
  preview(nextTree: Tree): RenderPlan;
  commit(plan: RenderPlan): { root: HTMLElement; tree: Tree };
  render(nextTree: Tree): { root: HTMLElement; tree: Tree };
  adoptEditedDOM(): Tree;
  destroy(): void;
}
export type Cleanup = () => void;
export type EffectSetup = () => void | Cleanup;
export type Dependencies = readonly unknown[] | undefined;
export type StateAction<T> = T | ((previous: T) => T);
export type StateSetter<T> = (action: StateAction<T>) => void;
export interface StateSlot { kind: 'state'; value: unknown; setter: (action: unknown) => void }
export interface MemoSlot { kind: 'memo'; initialized: boolean; value?: unknown; deps?: readonly unknown[] }
export interface EffectSlot { kind: 'effect'; initialized: boolean; setup: () => unknown; changed?: boolean; deps?: readonly unknown[]; cleanup?: Cleanup }
export type HookSlot = StateSlot | MemoSlot | EffectSlot;
export interface HookOwner {
  hooks: HookSlot[]; hookIndex: number; generation: number;
  enqueue(index: number, action: unknown, generation: number): void;
}
export function isRecord(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object'; }
// DOM nodeType is the cross-document discriminator; do not rely on one realm's constructors.
export function isElement(node: Node | null | undefined): node is Element { return node?.nodeType === 1; }
export function isHTMLElement(node: Node | null | undefined): node is HTMLElement { return isElement(node) && node.namespaceURI === 'http://www.w3.org/1999/xhtml'; }
export function isCharacterData(node: Node): node is Text | Comment { return node.nodeType === 3 || node.nodeType === 8; }
export function isInput(node: Node): node is HTMLInputElement { return isHTMLElement(node) && node.localName === 'input'; }
export function isTextControl(node: Node | null): node is HTMLInputElement | HTMLTextAreaElement { return isHTMLElement(node) && ['input', 'textarea'].includes(node.localName); }
export function isValueControl(node: Node): node is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement { return isHTMLElement(node) && ['input', 'textarea', 'select'].includes(node.localName); }
export function errorMessage(error: unknown): string { return error instanceof Error ? error.message : String(error); }
export function isOption(node: Node): node is HTMLOptionElement { return isHTMLElement(node) && node.localName === 'option'; }
