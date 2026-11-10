import type { DOMScope, Tree, RenderPlan, Renderer } from './types.js';
import { diff } from './diff.js';
import { patch, validatePatch } from './patch.js';
import { readTree, disposeDOM } from './dom.js';
export function createRenderer(host: HTMLElement, { role = 'managed', scope = null }: { role?: 'managed' | 'editable'; scope?: DOMScope | null } = {}): Renderer {
  if (!['managed', 'editable'].includes(role)) throw Error('Invalid renderer role');
  let committedTree = diff(readTree(host, scope), readTree(host, scope)).nextTree;
  let revision = 0, destroyed = false, error = false;
  const rendererId = Symbol('renderer'), issued = new WeakSet<RenderPlan>();
  const guard = () => { if (destroyed || error) throw Error('Renderer destroyed or in error state'); };
  function check(plan: RenderPlan): void {
    guard();
    if (!issued.has(plan) || plan.rendererId !== rendererId || plan.baseRevision !== revision) throw Error('Stale or foreign renderer plan');
    validatePatch(host, plan, scope);
  }
  const renderer: Renderer = {
    get committedTree() { return committedTree; },
    get revision() { return revision; },
    preview(nextTree: Tree) {
      guard();
      scope?.validateTree(nextTree);
      const plan = Object.freeze({ ...diff(committedTree, nextTree), rendererId, baseRevision: revision });
      issued.add(plan);
      return plan;
    },
    commit(plan: RenderPlan) {
      check(plan); // Preflight rejection does not poison a usable renderer.
      try {
        const result = patch(host, plan, scope);
        committedTree = result.tree; revision++;
        return result;
      } catch (cause) { error = true; throw cause; }
    },
    render(nextTree: Tree) { return renderer.commit(renderer.preview(nextTree)); },
    adoptEditedDOM() {
      guard();
      if (role !== 'editable') throw Error('Only editable renderer may adopt DOM');
      const candidate = readTree(host, scope);
      committedTree = diff(candidate, candidate).nextTree; revision++;
      return committedTree;
    },
    destroy() { if (!destroyed) { disposeDOM(host); destroyed = true; } }
  };
  return renderer;
}
