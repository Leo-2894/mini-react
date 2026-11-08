import { errorMessage } from './mini-react/types.js';
import type { AppState, RequestDraft } from './api/types.js';
import type { RowKind, RowField, RequestPreview } from './components/panels.js';
export interface AppProps { timeout?: number }
import { h } from './mini-react/vnode.js';
import { useState, useMemo, useEffect } from './mini-react/hooks.js';
import { buildRequest, sendRequest } from './api/request.js';
import { displayBody } from './api/response.js';
import { historyEntry, appendHistory, reuseHistory } from './api/history.js';
import { Sidebar, RequestEditor, ResponsePanel } from './components/panels.js';
const emptyDraft = (): RequestDraft => ({ method: 'GET', url: '', params: [], headers: [], body: '' });
export function App({ timeout = 30000 }: AppProps = {}) {
  const [state, set] = useState<AppState>(() => ({ draft: emptyDraft(), tab: 'params', responseTab: 'body', response: null, job: null, loading: false, history: [], expanded: {}, notice: '' }));
  const preview = useMemo<RequestPreview>(() => { try { return { snapshot: buildRequest(state.draft), error: '' }; } catch (error) { return { error: state.draft.url ? errorMessage(error) : '요청 URL을 입력하세요.' }; } }, [state.draft]);
  const body = useMemo(() => state.response?.type === 'response' ? displayBody(state.response) : null, [state.response]);
  const send = () => {
    if (preview.error || !preview.snapshot) return;
    const job = { id: crypto.randomUUID(), time: Date.now(), snapshot: preview.snapshot, timeout };
    set(previous => ({ ...previous, job, loading: true, response: null, expanded: {}, notice: '' }));
  };
  useEffect(() => {
    const job = state.job;
    if (!job) return;
    let active = true;
    const controller = new AbortController();
    sendRequest(job.snapshot, { signal: controller.signal, timeout: job.timeout }).then(result => {
      if (!active) return;
      const entry = historyEntry(job.snapshot, result, { id: job.id, time: job.time });
      set(previous => previous.job?.id !== job.id ? previous : ({ ...previous, job: null, loading: false, response: result, history: appendHistory(previous.history, entry) }));
    });
    return () => { active = false; controller.abort(); };
  }, [state.job]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); send(); } };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [preview, timeout]);
  const rowChange = (kind: RowKind, id: string, field: RowField, value: string | boolean) => set(previous => ({ ...previous, draft: { ...previous.draft, [kind]: previous.draft[kind].map(row => row.id === id ? { ...row, [field]: value } : row) } }));
  const rowAdd = (kind: RowKind) => { const row = { id: crypto.randomUUID(), name: '', value: '', enabled: true }; set(previous => ({ ...previous, draft: { ...previous.draft, [kind]: [...previous.draft[kind], row] } })); };
  return h('div', { attrs: { class: 'studio-layout' } },
    h(Sidebar, { entries: state.history, onSelect: entry => set(previous => ({ ...previous, draft: reuseHistory(entry), job: null, loading: false, response: null, notice: '이력은 method와 정제 URL만 복원합니다. Params·Headers·Body는 다시 입력하세요.' })), onClear: () => set(previous => ({ ...previous, history: [] })), onNew: () => set(previous => ({ ...previous, draft: emptyDraft(), response: null, job: null, loading: false, notice: '', tab: 'params' })) }),
    h('main', { attrs: { class: 'studio-main' } },
      h('header', { attrs: { class: 'topbar' } }, h('div', { attrs: { class: 'breadcrumb' } }, 'Personal workspace', h('span', {}, '/'), h('strong', {}, 'Untitled request')), h('span', { attrs: { class: 'browser-badge' } }, '● Browser session')),
      h('div', { attrs: { class: 'studio-content' } },
        state.notice ? h('p', { attrs: { class: 'notice', role: 'status' } }, state.notice) : null,
        h(RequestEditor, { draft: state.draft, tab: state.tab, preview, loading: state.loading, onDraft: (field, value) => set(previous => ({ ...previous, draft: { ...previous.draft, [field]: value } })), onTab: tab => set(previous => ({ ...previous, tab })), onSend: send,
          onCancel: () => set(previous => ({ ...previous, job: null, loading: false, response: { type: 'error', kind: 'aborted', message: '요청을 취소했습니다.', elapsed: 0 } })), onRowChange: rowChange, onRowAdd: rowAdd,
          onRowRemove: (kind, id) => set(previous => ({ ...previous, draft: { ...previous.draft, [kind]: previous.draft[kind].filter(row => row.id !== id) } })) }),
        h(ResponsePanel, { response: state.response, loading: state.loading, tab: state.responseTab, body, expanded: state.expanded, onTab: responseTab => set(previous => ({ ...previous, responseTab })), onToggle: (path, open) => set(previous => ({ ...previous, expanded: { ...previous.expanded, [path]: !open } })) }),
        h('footer', { attrs: { class: 'main-footer' } }, 'Small requests. Useful discoveries.', h('span', {}, 'API Studio · REST workspace')))));
}
