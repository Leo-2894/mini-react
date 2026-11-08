import { h } from '../mini-react/vnode.js';
import { isSensitiveHeader } from '../api/history.js';
const button = (label, onClick, attrs = {}) => h('button', { attrs: { type: 'button', ...attrs }, events: { click: onClick } }, label);
export function Sidebar({ entries, onSelect, onClear, onNew }) {
  return h('aside', { attrs: { class: 'sidebar' } },
    h('a', { attrs: { class: 'brand', href: './' } }, h('span', { attrs: { class: 'brand-mark' } }, 'a'), 'API STUDIO'),
    h('p', { attrs: { class: 'workspace-label' } }, 'PERSONAL WORKSPACE'),
    button('+ New request', onNew, { class: 'new-request' }),
    h('div', { attrs: { class: 'history-title' } }, h('h2', {}, 'Recent requests'), button('Clear', onClear, { disabled: entries.length === 0, class: 'text-button' })),
    h('nav', { attrs: { 'aria-label': 'Recent requests', class: 'history-list' } },
      entries.length ? entries.map(entry => button(h('span', {}, h('span', { attrs: { class: 'method-small ' + entry.method.toLowerCase() } }, entry.method), h('span', { attrs: { class: 'history-url' } }, entry.url), h('small', {}, (entry.status ?? 'Error') + ' · ' + entry.elapsed + ' ms')), () => onSelect(entry), { 'aria-label': 'Reuse ' + entry.method + ' ' + entry.url, class: 'history-entry' })) : h('div', { attrs: { class: 'history-empty' } }, h('span', {}, '↗'), h('p', {}, 'Your next request starts here.'), h('small', {}, '완료한 요청의 안전한 메타데이터만 이곳에 남습니다.'))),
    h('div', { attrs: { class: 'sidebar-footer' } }, h('span', { attrs: { class: 'privacy-dot' } }, '●'), ' Session only · 최대 20개', h('a', { attrs: { href: './phase1/' } }, 'Open DOM Lab ↗')));
}
export function KeyValueRows({ rows, kind, onChange, onAdd, onRemove }) {
  return h('section', { attrs: { class: 'key-values', 'aria-label': kind } },
    h('div', { attrs: { class: 'kv-heading' } }, h('span', {}, 'USE'), h('span', {}, 'KEY'), h('span', {}, 'VALUE'), h('span', {}, '')),
    rows.map((row, index) => h('div', { key: row.id, attrs: { class: 'kv-row' } },
      h('input', { attrs: { type: 'checkbox', 'aria-label': kind + ' enabled ' + (index + 1) }, props: { checked: row.enabled }, events: { change: event => onChange(row.id, 'enabled', event.target.checked) } }),
      h('input', { attrs: { type: 'text', placeholder: 'Key', 'aria-label': kind + ' key ' + (index + 1), autocomplete: 'off' }, props: { value: row.name }, events: { input: event => onChange(row.id, 'name', event.target.value) } }),
      h('input', { attrs: { type: isSensitiveHeader(row.name) ? 'password' : 'text', placeholder: 'Value', 'aria-label': kind + ' value ' + (index + 1), autocomplete: 'off' }, props: { value: row.value }, events: { input: event => onChange(row.id, 'value', event.target.value) } }),
      button('×', () => onRemove(row.id), { 'aria-label': 'Remove ' + kind + ' row ' + (index + 1), class: 'remove-row' }))),
    rows.length === 0 ? h('p', { attrs: { class: 'rows-empty' } }, '행을 추가해 요청 값을 입력하세요.') : null,
    button('+ Add ' + kind, onAdd, { class: 'add-row' }));
}
export function RequestEditor({ draft, tab, preview, loading, onDraft, onTab, onSend, onCancel, onRowChange, onRowAdd, onRowRemove }) {
  return h('section', { attrs: { class: 'request-panel', 'aria-label': 'Request builder' } },
    h('div', { attrs: { class: 'panel-heading' } }, h('div', {}, h('p', { attrs: { class: 'eyebrow' } }, 'BUILD YOUR REQUEST'), h('h1', {}, 'A little curiosity. A clear response.')), h('span', { attrs: { class: 'protocol-label' } }, 'REST / HTTP')),
    h('form', { attrs: { class: 'url-form' }, events: { submit: event => { event.preventDefault(); onSend(); } } },
      h('label', { attrs: { class: 'method-field' } }, h('span', { attrs: { class: 'sr-only' } }, 'HTTP method'), h('select', { props: { value: draft.method }, events: { change: event => onDraft('method', event.target.value) } }, ['GET','POST','PUT','PATCH','DELETE'].map(method => h('option', { key: method, attrs: { value: method } }, method)))),
      h('label', { attrs: { class: 'url-field' } }, h('span', { attrs: { class: 'sr-only' } }, 'Request URL'), h('input', { attrs: { type: 'url', placeholder: 'https://api.example.com/resource', autocomplete: 'off', spellcheck: 'false' }, props: { value: draft.url }, events: { input: event => onDraft('url', event.target.value) } })),
      h('button', { attrs: { type: 'submit', class: 'send-button', disabled: !!preview.error, 'aria-busy': loading } }, loading ? '↻ Send request' : 'Send request ↗')),
    h('div', { attrs: { class: 'request-hint' } }, h('span', {}, preview.error || 'Ready to send · Ctrl/⌘ + Enter'), loading ? button('Cancel request', onCancel, { class: 'cancel-button' }) : null),
    h('div', { attrs: { class: 'tabs', role: 'tablist', 'aria-label': 'Request settings' } }, ['params','headers','body'].map(name => button(name === 'params' ? 'Params' : name === 'headers' ? 'Headers' : 'Body', () => onTab(name), { id: 'request-tab-' + name, role: 'tab', 'aria-selected': name === tab, 'aria-controls': 'request-settings', class: name === tab ? 'tab active' : 'tab' }))),
    h('div', { attrs: { id: 'request-settings', role: 'tabpanel', 'aria-labelledby': 'request-tab-' + tab, class: 'request-settings' } },
      tab === 'body' ? h('div', { attrs: { class: 'body-editor' } }, h('div', { attrs: { class: 'editor-label' } }, h('label', { attrs: { for: 'json-body' } }, 'JSON request body'), h('span', {}, draft.method === 'GET' ? 'GET does not send a body' : 'application/json')), h('textarea', { attrs: { id: 'json-body', rows: '7', placeholder: '{"hello": "world"}', spellcheck: 'false', disabled: draft.method === 'GET' }, props: { value: draft.body }, events: { input: event => onDraft('body', event.target.value) } })) :
        h(KeyValueRows, { rows: draft[tab], kind: tab === 'params' ? 'parameter' : 'header', onChange: (id, field, value) => onRowChange(tab, id, field, value), onAdd: () => onRowAdd(tab), onRemove: id => onRowRemove(tab, id) })),
    h('p', { attrs: { class: 'cors-note' } }, '브라우저가 CORS·금지 헤더를 제한합니다. 인증값은 이력에 저장하지 않습니다.'));
}
export function JsonViewer({ value, expanded, onToggle }) {
  const rows = [], stack = [{ value, label: '$', path: [], depth: 0 }]; let limited = false;
  while (stack.length && rows.length < 200) {
    const item = stack.pop(), path = JSON.stringify(item.path), object = item.value !== null && typeof item.value === 'object';
    const entries = object ? Object.entries(item.value) : [], open = object && (expanded[path] ?? item.depth < 2);
    let text;
    if (object) text = (Array.isArray(item.value) ? 'Array' : 'Object') + ' · ' + entries.length;
    else { const full = JSON.stringify(item.value) ?? String(item.value); text = full.length > 1000 ? full.slice(0, 1000) + '…' : full; if (full.length > 1000) limited = true; }
    rows.push(h('div', { key: path, attrs: { class: 'json-row', style: 'padding-left:' + item.depth * 16 + 'px' } }, object && entries.length ? button(open ? '▾' : '▸', () => onToggle(path, open), { 'aria-label': 'Toggle ' + item.label, 'aria-expanded': open, class: 'json-toggle' }) : h('span', { attrs: { class: 'json-spacer' } }, '·'), h('span', { attrs: { class: 'json-key' } }, item.label + ': '), h('span', { attrs: { class: object ? 'json-summary' : 'json-value ' + typeof item.value } }, text)));
    if (open && entries.length) {
      if (item.depth >= 8) limited = true;
      else for (let i = Math.min(entries.length, 201) - 1; i >= 0; i--) stack.push({ value: entries[i][1], label: entries[i][0], path: [...item.path, entries[i][0]], depth: item.depth + 1 });
    }
  }
  limited ||= stack.length > 0;
  return h('div', { attrs: { class: 'json-viewer', 'aria-label': 'JSON tree' } }, rows, limited ? h('p', { attrs: { class: 'limit-note' } }, '트리 일부를 표시했습니다. Raw에서 응답 표시 범위를 확인하세요.') : null);
}
export function ResponsePanel({ response, loading, tab, body, expanded, onTab, onToggle }) {
  const isResponse = response?.type === 'response';
  return h('section', { attrs: { class: 'response-panel', 'aria-label': 'Response' } },
    h('div', { attrs: { class: 'response-heading' } }, h('h2', {}, 'Response'), h('div', { attrs: { class: 'response-meta' } }, isResponse ? h('span', { attrs: { class: response.ok ? 'status-badge success' : 'status-badge warning', 'data-testid': 'http-status' } }, response.status + ' ' + response.statusText) : null, response ? h('span', { attrs: { class: 'elapsed' } }, response.elapsed + ' ms') : null)),
    loading ? h('div', { attrs: { class: 'response-empty', role: 'status' } }, h('span', { attrs: { class: 'spinner' } }, '◌'), h('h3', {}, 'Waiting for a response'), h('p', {}, '다시 보내면 이전 요청은 취소됩니다.')) :
      !response ? h('div', { attrs: { class: 'response-empty' } }, h('span', { attrs: { class: 'empty-symbol' } }, '{ }'), h('h3', {}, 'The answer is a request away.'), h('p', {}, 'URL과 요청 옵션을 입력하고 Send request를 누르세요.')) :
        response.type === 'error' ? h('div', { attrs: { class: 'error-banner', role: 'alert' } }, h('strong', {}, response.kind === 'timeout' ? 'Request timed out' : response.kind === 'aborted' ? 'Request cancelled' : 'Connection failed'), h('p', {}, response.message)) :
          h('div', {}, h('div', { attrs: { class: 'tabs response-tabs', role: 'tablist', 'aria-label': 'Response views' } }, ['body','raw','headers'].map(name => button(name === 'body' ? 'JSON / Body' : name === 'raw' ? 'Raw' : 'Response headers', () => onTab(name), { id: 'response-tab-' + name, role: 'tab', 'aria-selected': tab === name, 'aria-controls': 'response-content', class: tab === name ? 'tab active' : 'tab' }))),
            response.parseError ? h('p', { attrs: { class: 'parse-warning', role: 'status' } }, '올바른 JSON이 아닙니다. 원문을 표시합니다.') : null,
            h('div', { attrs: { id: 'response-content', class: 'response-content', role: 'tabpanel', 'aria-labelledby': 'response-tab-' + tab } },
              tab === 'headers' ? h('dl', { attrs: { class: 'response-headers' } }, response.headers.map(header => h('div', { key: header.name }, h('dt', {}, header.name), h('dd', {}, header.value)))) :
                response.format === 'empty' ? h('p', { attrs: { class: 'muted' } }, 'No response body') :
                  tab === 'body' && response.format === 'json' && !body.truncated ? h(JsonViewer, { value: response.json, expanded, onToggle }) : h('pre', { attrs: { class: 'raw-body', 'aria-label': 'Response body' } }, tab === 'raw' ? response.text.slice(0, 100000) : body.text)),
            body.truncated || response.text.length > 100000 ? h('p', { attrs: { class: 'limit-note' } }, '응답을 100,000자까지 표시했습니다. 전체 수신 메모리 제한은 보장하지 않습니다.') : null));
}
