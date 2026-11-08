import { isTextControl, isHTMLElement } from '../mini-react/types.js';
// Radio groups need independent native form owners. ID relationships are now
// handled by each host's physical scope; label activation remains entirely native.
export function isolateHost(host: HTMLElement): () => void {
  const document = host.ownerDocument, active = document.activeElement;
  let selection: [number, number, 'forward' | 'backward' | 'none'] | undefined;
  if (host.contains(active) && isTextControl(active) && typeof active.selectionStart === 'number') selection = [active.selectionStart, active.selectionEnd ?? 0, active.selectionDirection ?? 'none'];
  const form = document.createElement('form');
  form.noValidate = true;
  const preventSubmit = (event: Event) => event.preventDefault();
  form.addEventListener('submit', preventSubmit);
  host.parentNode?.insertBefore(form, host);
  form.appendChild(host);
  if (host.contains(active) && isHTMLElement(active) && document.activeElement !== active) {
    active.focus({ preventScroll: true });
    if (selection && isTextControl(active)) active.setSelectionRange(...selection);
  }
  return () => {
    form.removeEventListener('submit', preventSubmit);
    if (host.parentNode === form) {
      if (form.parentNode) form.replaceWith(host);
      else form.removeChild(host);
    }
  };
}
