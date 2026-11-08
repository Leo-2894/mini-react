// Only the active render context is global; committed state belongs to each root.
let active = null;
export function withoutHooks(callback) {
  const previous = active;
  if (active) active = { ...active, allowed: false };
  try { return callback(); } finally { active = previous; }
}
export function renderWithHooks(owner, draft, initial, callback) {
  const previous = active;
  active = { owner, draft, initial, allowed: true };
  owner.hookIndex = 0;
  try {
    const result = callback();
    if (!initial && owner.hookIndex !== owner.hooks.length) throw Error('Hook count changed');
    return result;
  } finally { active = previous; }
}
export function useSlot(kind, initialize) {
  if (!active?.allowed) throw Error('Hooks are only allowed in the root render');
  const { owner, draft, initial } = active;
  const index = owner.hookIndex++;
  if (!initial && (!owner.hooks[index] || owner.hooks[index].kind !== kind)) throw Error('Hook kind/count changed');
  if (initial) draft[index] = withoutHooks(() => ({ kind, ...initialize(owner, index) }));
  return draft[index];
}
export function useState(initial) {
  const slot = useSlot('state', (owner, index) => {
    const generation = owner.generation;
    return { value: typeof initial === 'function' ? initial() : initial, setter: value => owner.enqueue(index, value, generation) };
  });
  return [slot.value, slot.setter];
}

export const isRendering = () => active !== null;
function copyDeps(deps) {
  if (deps !== undefined && !Array.isArray(deps)) throw Error('Dependencies must be an array or omitted');
  return deps?.slice();
}
function sameDeps(previous, next) {
  return previous !== undefined && next !== undefined && previous.length === next.length && previous.every((value, i) => Object.is(value, next[i]));
}
export function useMemo(factory, deps) {
  if (typeof factory !== 'function') throw Error('Memo factory must be a function');
  const nextDeps = copyDeps(deps), slot = useSlot('memo', () => ({ initialized: false }));
  if (!slot.initialized || !sameDeps(slot.deps, nextDeps)) slot.value = withoutHooks(factory);
  slot.deps = nextDeps; slot.initialized = true;
  return slot.value;
}
export function useEffect(setup, deps) {
  if (typeof setup !== 'function') throw Error('Effect setup must be a function');
  const nextDeps = copyDeps(deps), slot = useSlot('effect', () => ({ initialized: false }));
  slot.changed = !slot.initialized || !sameDeps(slot.deps, nextDeps);
  slot.setup = setup; slot.deps = nextDeps; slot.initialized = true;
}
export function cleanupEffects(slots) {
  const errors = [];
  for (const slot of slots) {
    const cleanup = slot.cleanup; slot.cleanup = undefined;
    if (cleanup) try { withoutHooks(cleanup); } catch (error) { errors.push(error); }
  }
  return errors;
}
export function commitEffects(hooks) {
  const changed = hooks.filter(slot => slot.kind === 'effect' && slot.changed);
  const errors = cleanupEffects(changed);
  for (const slot of changed) {
    slot.changed = false;
    try {
      const cleanup = withoutHooks(slot.setup);
      if (cleanup !== undefined && typeof cleanup !== 'function') {
        if (cleanup?.then) Promise.resolve(cleanup).catch(() => {});
        throw Error('Effect must return undefined or a synchronous cleanup function');
      }
      slot.cleanup = cleanup;
    } catch (error) { errors.push(error); }
  }
  for (const error of errors.slice(1)) console.error('Effect failed', error);
  if (errors.length) throw errors[0];
}
