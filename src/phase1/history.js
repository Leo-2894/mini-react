import { diff, equal } from '../mini-react/diff.js';
export function createHistory(initialTree, { limit = 50 } = {}) {
  if (!Number.isInteger(limit) || limit < 1) throw Error('Invalid history limit');
  let serial = 0, cursor = 0;
  const snapshot = (value, summary) => Object.freeze({ id: serial++, tree: diff(value, value).nextTree, summary });
  let entries = [snapshot(initialTree, '초기 DOM')];
  return {
    get entries() { return Object.freeze([...entries]); },
    get cursor() { return cursor; },
    get current() { return entries[cursor]; },
    append(value, summary = 'Patch') {
      if (equal(entries[cursor].tree, value)) return false;
      entries = entries.slice(0, cursor + 1); entries.push(snapshot(value, summary));
      if (entries.length > limit) entries.shift();
      cursor = entries.length - 1;
      return true;
    },
    select(index) {
      if (!Number.isInteger(index) || index < 0 || index >= entries.length) throw Error('Invalid history cursor');
      cursor = index;
      return entries[cursor];
    }
  };
}
