// Entorno de navegador simulado compartido por las pruebas de interfaz.
import { JSDOM } from 'jsdom';
export function prepararEntorno(url = 'http://localhost:5173/') {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url, pretendToBeVisual: true });
  const { window } = dom;
  for (const k of ['window', 'document', 'navigator', 'HTMLElement', 'Node', 'MutationObserver', 'localStorage', 'sessionStorage', 'getComputedStyle']) {
    try { Object.defineProperty(globalThis, k, { value: k === 'window' ? window : window[k], configurable: true, writable: true }); } catch {}
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const registro = { alertas: [], scrollIntoView: 0 };
  window.HTMLElement.prototype.scrollIntoView = function () { registro.scrollIntoView++; };
  window.confirm = () => true;
  return { window, registro };
}
export const respuesta = (datos, status = 200) => ({ ok: status < 400, status, json: async () => datos });
