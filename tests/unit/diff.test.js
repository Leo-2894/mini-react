import { describe, it, expect } from 'vitest';
import { h, tree, text } from '../../src/mini-react/vnode.ts';
import { diff } from '../../src/mini-react/diff.ts';
const p = (key, label = key, tag = 'p') => h(tag, { key }, label);
const frozen = obj => { if (obj && typeof obj === 'object') { Object.values(obj).forEach(frozen); Object.freeze(obj); } return obj; };
describe('F01/F02 pure diff plans', () => {
  it('has no operations for equal independent trees', () => expect(diff(tree(p('a')), tree(p('a'))).operations).toEqual([]));
  it('plans literal text and attribute add/change/remove', () => {
    const old = tree(h('p', { attrs: { class: 'old', title: 'remove' } }, 'old'));
    const next = tree(h('p', { attrs: { class: 'new', id: 'add' } }, 'new'));
    expect(diff(old, next).operations).toEqual([
      { type: 'ATTRS', target: { old: 1 }, set: { class: 'new', id: 'add' }, remove: ['title'] },
      { type: 'TEXT', target: { old: 2 }, text: 'new' }
    ]);
  });
  it('represents keyed inserts and removals without changing survivors', () => {
    const ops = diff(tree(p('a'), p('b'), p('c'), p('d')), tree(p('b'), p('e'), p('d'))).operations;
    expect(ops).toEqual([
      { type: 'CREATE', id: 0, subtree: p('e') },
      { type: 'CHILDREN', parent: { old: 0 }, previous: [{ old: 1 }, { old: 3 }, { old: 5 }, { old: 7 }], next: [{ old: 3 }, { fresh: 0 }, { old: 7 }] }
    ]);
  });
  it('represents a keyed tag replacement and text/element replacement', () => {
    const plan = diff(tree(p('a'), text('x')), tree(p('a', 'a', 'span'), h('strong', {}, 'y')));
    expect(plan.operations.filter(o => o.type === 'CREATE')).toHaveLength(2);
    expect(plan.operations.at(-1).next).toEqual([{ fresh: 0 }, { fresh: 1 }]);
  });
  it('handles last removal, root additions and deep changes', () => {
    expect(diff(tree(p('a')), tree()).operations).toEqual([{ type: 'CHILDREN', parent: { old: 0 }, previous: [{ old: 1 }], next: [] }]);
    expect(diff(tree(), tree(h('div', {}, p('a')))).operations).toHaveLength(2);
    expect(diff(tree(h('section', {}, h('div', {}, 'a'))), tree(h('section', {}, h('div', {}, 'b')))).operations).toEqual([{ type: 'TEXT', target: { old: 3 }, text: 'b' }]);
  });
  it('reorders keyed siblings while matching unkeyed whitespace in sequence', () => {
    const old = tree(' ', p('a'), ' ', p('b'));
    const next = tree(' ', p('b'), ' ', p('a'));
    expect(diff(old, next).operations).toEqual([{ type: 'CHILDREN', parent: { old: 0 }, previous: [{ old: 1 }, { old: 2 }, { old: 4 }, { old: 5 }], next: [{ old: 1 }, { old: 5 }, { old: 4 }, { old: 2 }] }]);
  });
  it('is immutable and retains distinct event function identities', () => {
    const a = () => {}, b = () => {};
    const old = frozen(tree(h('button', { events: { click: a } })));
    const next = frozen(tree(h('button', { events: { click: b } })));
    const plan = diff(old, next);
    expect(plan.operations).toEqual([{ type: 'EVENTS', target: { old: 1 }, next: { click: b } }]);
    expect(plan.nextTree).not.toBe(next);
    expect(Object.isFrozen(plan.operations)).toBe(true);
    expect(old.children[0].events.click).toBe(a);
  });
  it('rejects duplicate keys in manually constructed inputs', () => {
    const next = tree(); next.children = [p('a'), p('a')];
    expect(() => diff(tree(), next)).toThrow(/Duplicate/);
  });
});
