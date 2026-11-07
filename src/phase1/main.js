import { h, tree } from '../mini-react/vnode.js';
import { createDOM, domToVNode } from '../mini-react/dom.js';
import { createRenderer } from '../mini-react/renderer.js';
import { createPhase1 } from './controller.js';
import { validatePolicy, protectEditor } from './html-policy.js';
const $ = id => document.getElementById(id);
const actual = $('actual-host'), editor = $('edit-host');
const app = createPhase1(actual, editor);
const feedback = createRenderer($('feedback-host'));
let message = '실제 DOM을 읽어 테스트 영역에 복제했습니다. 초기 상태 S0가 저장되었습니다.', isError = false, draft = false, serial = 0;
function updateFeedback() {
  const history = app.history;
  feedback.render(tree(
    h('div', { key: 'status', attrs: { class: isError ? 'status error' : 'status', role: isError ? 'alert' : 'status' } }, message),
    h('section', { key: 'history', attrs: { class: 'panel history' } },
      h('div', { attrs: { class: 'panel-heading' } }, h('h2', {}, 'State History'), h('span', {}, `${history.cursor + 1} / ${history.entries.length} · MAX 50`)),
      h('ol', {}, history.entries.map((entry, index) => h('li', { key: entry.id }, h('button', { attrs: { type: 'button', 'aria-current': index === history.cursor ? 'true' : 'false' }, events: { click: () => run(() => { app.travel(index); draft = false; return `S${entry.id}로 양 영역을 복원했습니다.`; }) } }, `S${entry.id} · ${entry.summary}`))))
    )
  ));
  // Button state changes also use the same engine, without owning the editable DOM.
  controls.render(tree(...controlTree()));
}
function controlTree() {
  const attrs = disabled => ({ type: 'button', disabled });
  return [
    h('button', { key: 'patch', attrs: { ...attrs(app.locked), id: 'patch', class: 'primary' }, events: { click: apply } }, 'Patch 적용'),
    h('button', { key: 'undo', attrs: { ...attrs(app.locked || app.history.cursor === 0), id: 'undo' }, events: { click: () => travel(-1) } }, 'Undo'),
    h('button', { key: 'redo', attrs: { ...attrs(app.locked || app.history.cursor === app.history.entries.length - 1), id: 'redo' }, events: { click: () => travel(1) } }, 'Redo'),
    h('button', { key: 'restore', attrs: { ...attrs(app.locked || !draft), id: 'restore' }, events: { click: () => run(() => { app.restoreDraft(); draft = false; return '미적용 편집을 되돌렸습니다.'; }) } }, '편집 되돌리기')
  ];
}
const controls = createRenderer(document.querySelector('.toolbar'));
function run(action) {
  try { message = action(); isError = false; }
  catch (error) { message = error.message; isError = true; }
  updateFeedback();
}
function apply() { run(() => { const result = app.apply(); draft = false; return result.changed ? `Patch 완료: ${result.operations.length}개 명령을 적용하고 양 영역 상태를 저장했습니다.` : '변경 없음: History와 Redo 경로를 유지했습니다.'; }); }
function travel(offset) { run(() => { app.travel(app.history.cursor + offset); draft = false; return '양 영역과 History 커서를 함께 이동했습니다.'; }); }
function edited() { draft = true; message = '미적용 편집이 있습니다. Patch를 적용하거나 편집을 되돌리세요.'; isError = false; updateFeedback(); }
function target() {
  const node = editor.querySelector($('target').value);
  if (!node) throw Error('대상 선택자에 해당하는 요소가 없습니다.');
  return node;
}
function edit(action) {
  run(() => {
    const node = target(), vnode = domToVNode(node);
    // Validate an independent detached candidate before any editable-host write.
    const candidate = action(vnode);
    if (candidate) validatePolicy(tree(candidate));
    if (candidate) node.replaceWith(createDOM(candidate)); else node.remove();
    draft = true;
    return '테스트 DOM 편집 완료. 실제 영역에는 아직 적용되지 않았습니다.';
  });
}
$('set-text').addEventListener('click', () => edit(v => ({ ...v, children: [{ kind: 'text', text: $('edit-text').value }], props: ['textarea', 'select'].includes(v.tag) ? { ...v.props, value: $('edit-text').value } : v.props })));
$('add-node').addEventListener('click', () => edit(v => ({ ...v, children: [...v.children, h($('tag').value, { key: `added-${++serial}` }, $('edit-text').value)] })));
$('remove-node').addEventListener('click', () => edit(() => null));
$('replace-node').addEventListener('click', () => edit(v => h($('tag').value, { key: v.key }, $('edit-text').value)));
$('set-attr').addEventListener('click', () => edit(v => {
  const name = $('attr-name').value.trim().toLowerCase();
  const next = h(v.tag, { key: v.key, attrs: { ...v.attrs, [name]: $('attr-value').value }, props: v.props, events: v.events }, v.children);
  if (name === 'value' && Object.hasOwn(v.props, 'value')) next.props.value = $('attr-value').value;
  return next;
}));
$('remove-attr').addEventListener('click', () => edit(v => { const attrs = { ...v.attrs }; delete attrs[$('attr-name').value.trim().toLowerCase()]; return { ...v, attrs }; }));
editor.addEventListener('input', edited);
protectEditor(editor, edited);
updateFeedback();
