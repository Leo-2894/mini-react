import { FunctionComponent } from './mini-react/component.js';
import { App } from './App.js';
export const root = new FunctionComponent(App);
root.mount(document.querySelector('#app'));
window.addEventListener('pagehide', event => { if (!event.persisted) root.unmount(); });
