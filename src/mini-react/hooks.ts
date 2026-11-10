import { isRecord } from './types.js';
import type { HookOwner, HookSlot, StateSlot, MemoSlot, EffectSlot, StateSetter, EffectSetup, Dependencies, Cleanup } from './types.js';
interface SlotMap { state: StateSlot; memo: MemoSlot; effect: EffectSlot }
interface HookContext { owner: HookOwner; draft: HookSlot[]; initial: boolean; allowed: boolean }
// Only the active render context is global; committed state belongs to each root.
let active: HookContext | null = null;
export function withoutHooks<T>(callback: () => T): T {
  const previous = active;
  if (active) active = { ...active, allowed: false };
  try { return callback(); } finally { active = previous; }
}
export function renderWithHooks<T>(owner: HookOwner, draft: HookSlot[], initial: boolean, callback: () => T): T {
  const previous = active;
  active = { owner, draft, initial, allowed: true };
  owner.hookIndex = 0;
  try {
    const result = callback();
    if (!initial && owner.hookIndex !== owner.hooks.length) throw Error('Hook count changed');
    return result;
  } finally { active = previous; }
}
export function useSlot<K extends keyof SlotMap>(kind: K, initialize: (owner: HookOwner, index: number) => Omit<SlotMap[K], 'kind'>): SlotMap[K] {
  if (!active?.allowed) throw Error('Hooks are only allowed in the root render');
  const { owner, draft, initial } = active;
  const index = owner.hookIndex++;
  if (!initial && (!owner.hooks[index] || owner.hooks[index].kind !== kind)) throw Error('Hook kind/count changed');
  if (initial) draft[index] = withoutHooks(() => ({ kind, ...initialize(owner, index) } as SlotMap[K]));
  // The positional/kind guard above establishes this internal slot correlation.
  return draft[index] as SlotMap[K];
}
export function useState<T>(initial: T | (() => T)): [T, StateSetter<T>] {
  const slot = useSlot('state', (owner, index) => {
    const generation = owner.generation;
    return { value: isInitializer(initial) ? initial() : initial, setter: (value: unknown) => owner.enqueue(index, value, generation) };
  });
  return [slot.value as T, slot.setter];
}

export const isRendering = () => active !== null;
function copyDeps(deps: Dependencies): unknown[] | undefined {
  if (deps !== undefined && !Array.isArray(deps)) throw Error('Dependencies must be an array or omitted');
  return deps?.slice();
}
function sameDeps(previous: Dependencies, next: Dependencies): boolean {
  return previous !== undefined && next !== undefined && previous.length === next.length && previous.every((value, i) => Object.is(value, next[i]));
}
export function useMemo<T>(factory: () => T, deps?: readonly unknown[]): T {
  if (typeof factory !== 'function') throw Error('Memo factory must be a function');
  const nextDeps = copyDeps(deps), slot = useSlot('memo', () => ({ initialized: false }));
  if (!slot.initialized || !sameDeps(slot.deps, nextDeps)) slot.value = withoutHooks(factory);
  slot.deps = nextDeps; slot.initialized = true;
  return slot.value as T;
}
export function useEffect(setup: EffectSetup, deps?: readonly unknown[]): void {
  if (typeof setup !== 'function') throw Error('Effect setup must be a function');
  const nextDeps = copyDeps(deps), slot = useSlot('effect', () => ({ initialized: false, setup }));
  slot.changed = !slot.initialized || !sameDeps(slot.deps, nextDeps);
  slot.setup = setup; slot.deps = nextDeps; slot.initialized = true;
}
export function cleanupEffects(slots: EffectSlot[]): unknown[] {
  const errors: unknown[] = [];
  for (const slot of slots) {
    const cleanup = slot.cleanup; slot.cleanup = undefined;
    if (cleanup) try { withoutHooks(cleanup); } catch (error) { errors.push(error); }
  }
  return errors;
}
export function commitEffects(hooks: HookSlot[]): void {
  const changed = hooks.filter((slot): slot is EffectSlot => slot.kind === 'effect' && !!slot.changed);
  const errors = cleanupEffects(changed);
  for (const slot of changed) {
    slot.changed = false;
    try {
      const cleanup = withoutHooks(slot.setup);
      if (cleanup !== undefined && !isCleanup(cleanup)) {
        if (isRecord(cleanup) && typeof cleanup.then === 'function') Promise.resolve(cleanup).catch(() => {});
        throw Error('Effect must return undefined or a synchronous cleanup function');
      }
      slot.cleanup = cleanup;
    } catch (error) { errors.push(error); }
  }
  for (const error of errors.slice(1)) console.error('Effect failed', error);
  if (errors.length) throw errors[0];
}

function isCleanup(value: unknown): value is Cleanup { return typeof value === 'function'; }

function isInitializer<T>(value: T | (() => T)): value is () => T { return typeof value === 'function'; }
