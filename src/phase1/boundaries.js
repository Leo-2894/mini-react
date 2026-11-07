// Phase 1 clones logical DOM, including name/id/for. Native radio groups need
// separate form owners; label default activation needs an independent local lookup.
// Wrappers live OUTSIDE managed hosts: child Trees and source Node identity stay intact.
export function isolateHost(host) {
  const document = host.ownerDocument;
  const form = document.createElement('form');
  form.noValidate = true;
  const preventSubmit = event => event.preventDefault();
  form.addEventListener('submit', preventSubmit);
  host.parentNode?.insertBefore(form, host);
  form.appendChild(host);
  const activateLabel = event => {
    if (event.defaultPrevented || event.button !== 0) return;
    const label = event.target.closest?.('label');
    if (!label || !host.contains(label)) return;
    const interactive = event.target.closest?.('input,button,select,textarea,a[href]');
    if (interactive && label.contains(interactive)) return;
    const id = label.getAttribute('for');
    const control = id === null
      ? label.querySelector('input:not([type="hidden"]),button,select,textarea')
      : [...host.querySelectorAll('[id]')].find(node => node.id === id);
    // Cancel document-global label activation even if no local target exists.
    event.preventDefault();
    if (control?.matches('input:not([type="hidden"]),button,select,textarea') && !control.disabled) {
      control.focus();
      control.click(); // Preserves native checkbox/radio/input/change semantics.
    }
  };
  host.addEventListener('click', activateLabel, true);
  return () => {
    host.removeEventListener('click', activateLabel, true);
    form.removeEventListener('submit', preventSubmit);
    if (host.parentNode === form) {
      if (form.parentNode) form.replaceWith(host);
      else form.removeChild(host);
    }
  };
}
