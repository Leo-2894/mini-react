import { createRenderer } from './renderer.js';
import { tree } from './vnode.js';
import { renderWithHooks, withoutHooks } from './hooks.js';

export class FunctionComponent {
  constructor(App, initialProps = {}) {
    if (typeof App !== 'function') throw Error('Expected a root function');
    this.App = App; this.props = initialProps; this.nextProps = initialProps;
    this.hooks = []; this.queues = new Map(); this.hookIndex = 0;
    this.renderer = null; this.mounted = false; this.error = null;
    this.pending = false; this.propsPending = false; this.committed = false;
    this.phase = 'idle'; this.ticket = 0; this.generation = 0;
  }
  mount(host) {
    if (this.mounted) throw Error('Root is already mounted');
    if (!host || host.childNodes.length) throw Error('mount requires an empty host');
    ++this.generation; this.renderer = createRenderer(host); this.mounted = true; this.committed = false;
    this.error = null; this.update();
    return this;
  }
  enqueue(index, action, generation) {
    if (generation !== this.generation) { console.warn('Ignored stale setter'); return; }
    if (this.phase !== 'idle') throw Error('Setter is forbidden during render/updater');
    if (!this.mounted) { console.warn('Ignored setter after unmount'); return; }
    if (this.error) throw Error('Root failed; call update() explicitly to retry');
    const queue = this.queues.get(index) || [];
    if (!queue.length && typeof action !== 'function' && Object.is(this.hooks[index].value, action)) return;
    queue.push(action); this.queues.set(index, queue); this.schedule();
  }
  schedule() {
    if (this.pending) return;
    this.pending = true; const ticket = ++this.ticket;
    queueMicrotask(() => {
      if (!this.mounted || ticket !== this.ticket) return;
      this.pending = false;
      try { this.update(); } catch (error) { console.error('Root update failed', error); }
    });
  }
  updateProps(nextProps) {
    if (this.phase !== 'idle') throw Error('Props cannot change during render');
    if (!this.mounted) throw Error('Root is not mounted');
    if (this.error) throw Error('Root failed; call update() explicitly to retry');
    this.nextProps = nextProps; this.propsPending = !Object.is(nextProps, this.props);
    if (this.propsPending) this.schedule();
  }
  update() {
    if (!this.mounted) { console.warn('Ignored update after unmount'); return; }
    if (this.phase !== 'idle') throw Error('Root update reentry');
    ++this.ticket; this.pending = false;
    const retry = !!this.error; this.error = null;
    const queues = this.queues; this.queues = new Map();
    const draft = this.hooks.map(slot => ({ ...slot }));
    const props = this.propsPending ? this.nextProps : this.props;
    try {
      this.phase = 'updater';
      for (const [index, actions] of queues) {
        if (draft[index]?.kind !== 'state') throw Error('Hook kind changed in state queue');
        for (const action of actions) draft[index].value = typeof action === 'function' ? withoutHooks(() => action(draft[index].value)) : action;
      }
      const changed = draft.some((slot, i) => slot.kind === 'state' && !Object.is(slot.value, this.hooks[i].value));
      if (this.committed && !changed && !this.propsPending && !retry) return;
      this.phase = 'render';
      const node = renderWithHooks(this, draft, !this.committed, () => this.App(props));
      this.renderer.render(tree(node));
      this.hooks = draft; this.props = props; this.nextProps = props;
      this.propsPending = false; this.committed = true;
    } catch (error) {
      this.error = error; this.queues.clear(); this.propsPending = false; this.nextProps = this.props;
      throw error;
    } finally { this.phase = 'idle'; }
  }
  unmount() {
    if (this.phase !== 'idle') throw Error('Cannot unmount during render');
    if (!this.mounted) return;
    this.mounted = false; ++this.ticket; this.pending = false; this.queues.clear();
    try { this.renderer.render(tree()); }
    finally { this.renderer.destroy(); this.hooks = []; this.committed = false; }
  }
}
