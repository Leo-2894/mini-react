import { diff } from './diff.js';
import { patch, validatePatch } from './patch.js';
import { readTree, disposeDOM } from './dom.js';
export function createRenderer(host, { role = 'managed', scope = null } = {}) {
  if (!['managed', 'editable'].includes(role)) throw Error('Invalid renderer role');
  let committedTree = diff(readTree(host, scope), readTree(host, scope)).nextTree;
  let revision = 0, destroyed = false, error = false;
  const rendererId = Symbol('renderer'), issued = new WeakSet();
  const guard = () => { if (destroyed || error) throw Error('Renderer destroyed or in error state'); };
  function check(plan) {
    guard();
    if (!issued.has(plan) || plan.rendererId !== rendererId || plan.baseRevision !== revision) throw Error('Stale or foreign renderer plan');
    validatePatch(host, plan, scope);
  }
  const renderer = {
    get committedTree() { return committedTree; },
    get revision() { return revision; },
    preview(nextTree) {
      guard();
      scope?.validateTree(nextTree);
      const plan = Object.freeze({ ...diff(committedTree, nextTree), rendererId, baseRevision: revision });
      issued.add(plan);
      return plan;
    },
    commit(plan) {
      check(plan); // Preflight rejection does not poison a usable renderer.
      try {
        const result = patch(host, plan, scope);
        committedTree = result.tree; revision++;
        return result;
      } catch (cause) { error = true; throw cause; }
    },
    render(nextTree) { return renderer.commit(renderer.preview(nextTree)); },
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
