import { validateTree } from '../mini-react/vnode.js';
const tags = new Set('div span p section article header footer main nav aside h1 h2 h3 h4 h5 h6 ul ol li strong em b i small code pre blockquote br hr table thead tbody tfoot tr th td caption label input textarea button select option'.split(' '));
const common = new Set('class id title role lang dir hidden tabindex'.split(' '));
const form = new Set('type name value checked selected disabled placeholder readonly min max step rows cols'.split(' '));
const css = new Set('color background-color font-size font-weight text-align margin padding border'.split(' '));
export function validatePolicy(value, document = globalThis.document) {
  validateTree(value);
  function visit(node) {
    if (node.kind !== 'element') return;
    if (!tags.has(node.tag)) throw Error(`편집에서 허용하지 않는 태그: ${node.tag}`);
    for (const [name, value] of Object.entries(node.attrs)) {
      const allowed = common.has(name) || /^(data|aria)-[a-z0-9_.-]+$/.test(name) || (name === 'for' && node.tag === 'label') || (['colspan', 'rowspan', 'scope'].includes(name) && ['td', 'th'].includes(node.tag)) || (form.has(name) && ['input', 'textarea', 'button', 'select', 'option'].includes(node.tag));
      if (name === 'style') {
        if (/url\s*\(|var\s*\(|expression\s*\(|[@\\!]/i.test(value)) throw Error('안전하지 않은 style');
        for (const declaration of value.split(';').filter(s => s.trim())) {
          const colon = declaration.indexOf(':');
          const property = declaration.slice(0, colon).trim().toLowerCase(), val = declaration.slice(colon + 1).trim();
          if (colon < 0 || !css.has(property) || !val) throw Error(`허용하지 않는 CSS: ${property}`);
          const probe = document.createElement('span').style;
          probe.setProperty(property, val);
          if (!probe.getPropertyValue(property)) throw Error(`잘못된 CSS 값: ${property}`);
        }
      } else if (!allowed) throw Error(`편집에서 허용하지 않는 속성: ${name}`);
    }
    if (node.tag === 'input' && !['text', 'number', 'checkbox', 'radio'].includes((node.attrs.type || 'text').toLowerCase())) throw Error('허용하지 않는 input type');
    if (node.tag === 'button' && node.attrs.type !== 'button') throw Error('button type은 button이어야 합니다');
    node.children.forEach(visit);
  }
  value.children.forEach(visit);
  return value;
}
// Used only on the editable host; paste/drop HTML never reaches the DOM.
export function insertPlainText(host, value) {
  const selection = host.ownerDocument.getSelection();
  if (selection?.rangeCount && host.contains(selection.getRangeAt(0).commonAncestorContainer)) {
    const range = selection.getRangeAt(0); range.deleteContents();
    const node = host.ownerDocument.createTextNode(value); range.insertNode(node);
    range.setStartAfter(node); range.collapse(true); selection.removeAllRanges(); selection.addRange(range);
  } else host.append(host.ownerDocument.createTextNode(value));
}
export function protectEditor(host, changed = () => {}) {
  const handler = event => {
    event.preventDefault();
    const transfer = event.clipboardData || event.dataTransfer;
    insertPlainText(host, transfer?.getData('text/plain') || '');
    changed();
  };
  host.addEventListener('paste', handler); host.addEventListener('drop', handler);
  return () => { host.removeEventListener('paste', handler); host.removeEventListener('drop', handler); };
}
