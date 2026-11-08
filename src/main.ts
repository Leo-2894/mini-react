import { FunctionComponent } from './mini-react/component.js';
import { App } from './App.js';
export const root = new FunctionComponent(App);
const host = document.querySelector<HTMLElement>('#app');
if (!host) throw Error('Missing app host');
root.mount(host);
window.addEventListener('pagehide', event => { if (!event.persisted) root.unmount(); });
