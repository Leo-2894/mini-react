import type { VNode, HookSlot, Renderer, EffectSlot } from './types.js';
import { createRenderer } from './renderer.js';
import { tree } from './vnode.js';
import { renderWithHooks, withoutHooks, isRendering, commitEffects, cleanupEffects } from './hooks.js';

export class FunctionComponent<P extends object = Record<string, never>> {
  App: (props: P) => VNode | null;
  props: P; nextProps: P;
  hooks: HookSlot[]; queues: Map<number, unknown[]>; hookIndex: number;
  renderer: Renderer | null; mounted: boolean; error: unknown;
  pending: boolean; propsPending: boolean; committed: boolean;
  phase: 'idle' | 'updater' | 'render' | 'effects';
  ticket: number; generation: number; autoUpdates: number;
  constructor(App: (props: P) => VNode | null, initialProps: P = {} as P) {
    if (typeof App !== 'function') throw Error('Expected a root function');
    this.App = App; this.props = initialProps; this.nextProps = initialProps;
    this.hooks = []; this.queues = new Map<number, unknown[]>(); this.hookIndex = 0;
    this.renderer = null; this.mounted = false; this.error = null;
    this.pending = false; this.propsPending = false; this.committed = false;
    this.phase = 'idle'; this.ticket = 0; this.generation = 0; this.autoUpdates = 0;
  }
  mount(host: HTMLElement): this {
    if (this.mounted) throw Error('Root is already mounted');
    if (!host || host.childNodes.length) throw Error('mount requires an empty host');
    ++this.generation; this.renderer = createRenderer(host); this.mounted = true; this.committed = false;
    this.error = null; this.update();
    return this;
  }
  enqueue(index: number, action: unknown, generation: number): void {
    if (generation !== this.generation) { console.warn('Ignored stale setter'); return; }
    if (!this.mounted) { console.warn('Ignored setter after unmount'); return; }
    if (isRendering() || !['idle', 'effects'].includes(this.phase)) throw Error('Setter is forbidden during render/updater');
    if (this.error) throw Error('Root failed; call update() explicitly to retry');
    const queue = this.queues.get(index) || [];
    const current = this.hooks[index];
    if (!queue.length && typeof action !== 'function' && current && 'value' in current && Object.is(current.value, action)) return;
    queue.push(action); this.queues.set(index, queue); this.schedule();
  }
  schedule(): void {
    if (this.pending) return;
    this.pending = true; const ticket = ++this.ticket;
    queueMicrotask(() => {
      if (!this.mounted || ticket !== this.ticket) return;
      this.pending = false;
      try {
        if (++this.autoUpdates > 50) throw Error('Automatic update loop exceeded 50 updates');
        this.update();
      } catch (error) {
        this.error = error; this.queues.clear(); ++this.ticket; this.pending = false;
        console.error('Root update failed', error);
      } finally { if (!this.pending) this.autoUpdates = 0; }
    });
  }
  updateProps(nextProps: P): void {
    if (this.phase !== 'idle') throw Error('Props cannot change during render');
    if (!this.mounted) throw Error('Root is not mounted');
    if (this.error) throw Error('Root failed; call update() explicitly to retry');
    this.nextProps = nextProps; this.propsPending = !Object.is(nextProps, this.props);
    if (this.propsPending) this.schedule();
  }
  update(): void {
    if (!this.mounted) { console.warn('Ignored update after unmount'); return; }
    if (this.phase !== 'idle') throw Error('Root update reentry');
    ++this.ticket; this.pending = false;
    const retry = !!this.error; this.error = null;
    const queues = this.queues; this.queues = new Map<number, unknown[]>();
    const draft = this.hooks.map(slot => ({ ...slot }));
    const props = this.propsPending ? this.nextProps : this.props;
    try {
      this.phase = 'updater';
      for (const [index, actions] of queues) {
        const slot = draft[index];
        if (slot?.kind !== 'state') throw Error('Hook kind changed in state queue');
        for (const action of actions) slot.value = typeof action === 'function' ? withoutHooks(() => action(slot.value)) : action;
      }
      const changed = draft.some((slot, i) => { const previous = this.hooks[i]; return slot.kind === 'state' && previous.kind === 'state' && !Object.is(slot.value, previous.value); });
      if (this.committed && !changed && !this.propsPending && !retry) return;
      this.phase = 'render';
      const node = renderWithHooks(this, draft, !this.committed, () => this.App(props));
      if (!this.renderer) throw Error('Root renderer missing');
      this.renderer.render(tree(node));
      this.hooks = draft; this.props = props; this.nextProps = props;
      this.propsPending = false; this.committed = true;
      this.phase = 'effects'; commitEffects(this.hooks);
    } catch (error) {
      this.error = error; this.queues.clear(); ++this.ticket; this.pending = false; this.propsPending = false; this.nextProps = this.props;
      throw error;
    } finally { this.phase = 'idle'; }
  }
  unmount(): void {
    if (this.phase !== 'idle') throw Error('Cannot unmount during render');
    if (!this.mounted) return;
    this.mounted = false; ++this.ticket; this.pending = false; this.queues.clear();
    this.propsPending = false; this.nextProps = this.props;
    this.phase = 'effects';
    for (const error of cleanupEffects(this.hooks.filter((slot): slot is EffectSlot => slot.kind === 'effect'))) { this.error = error; console.error('Effect cleanup failed', error); }
    this.phase = 'idle';
    try { if (!this.renderer) throw Error('Root renderer missing'); this.renderer.render(tree()); }
    finally { this.renderer?.destroy(); this.hooks = []; this.committed = false; }
  }
}
