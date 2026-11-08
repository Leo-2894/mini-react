// Radio groups need independent native form owners. ID relationships are now
// handled by each host's physical scope; label activation remains entirely native.
export function isolateHost(host) {
  const document = host.ownerDocument, active = document.activeElement;
  let selection;
  if (host.contains(active) && typeof active.selectionStart === 'number') selection = [active.selectionStart, active.selectionEnd, active.selectionDirection];
  const form = document.createElement('form');
  form.noValidate = true;
  const preventSubmit = event => event.preventDefault();
  form.addEventListener('submit', preventSubmit);
  host.parentNode?.insertBefore(form, host);
  form.appendChild(host);
  if (host.contains(active) && document.activeElement !== active) {
    active.focus({ preventScroll: true });
    if (selection) active.setSelectionRange(...selection);
  }
  return () => {
    form.removeEventListener('submit', preventSubmit);
    if (host.parentNode === form) {
      if (form.parentNode) form.replaceWith(host);
      else form.removeChild(host);
    }
  };
}
