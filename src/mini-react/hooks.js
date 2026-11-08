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
