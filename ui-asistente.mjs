import assert from 'node:assert/strict';
import { prepararEntorno, respuesta } from './ui-comun.tmp.mjs';
const { window, registro } = prepararEntorno();

const tarjeta = (n, extra = {}) => ({ id: `id-${n}`, nombre: `Producto ${n}`, descripcion: `Descripción ${n}`, categoria: 'COMIDA_RAPIDA', precio: 10000 * n, cantidadDisponible: 5, creadoEn: '2026-10-10T12:00:00Z', estadoVenta: 'DISPONIBLE', calificacion: { promedio: null, total: 0 }, imagenes: [{ url: `/uploads/${n}.jpg` }], local: { id: 'l1', nombre: 'Los pollos hermanos', logoUrl: null }, ...extra });
let usuarioActual = 'u1'; const llamadas = []; let chat = () => respuesta({ respuesta: 'Hola', productos: [] }); let recomendados = () => respuesta({ origen: 'ia', productos: [] });
let demora = 0;
globalThis.fetch = async (url, opts = {}) => {
  const u = new URL(url, 'http://localhost'); const cuerpo = opts.body ? JSON.parse(opts.body) : null;
  llamadas.push({ ruta: u.pathname + u.search, cuerpo });
  if (u.pathname === '/api/auth/me') return respuesta({ id: usuarioActual, nombre: 'Ale' });
  if (u.pathname === '/api/chatbot') { if (demora) await new Promise((r) => setTimeout(r, demora)); return chat(cuerpo); }
  if (u.pathname === '/api/chatbot/recomendados') return recomendados();
  if (u.pathname === '/api/productos') return respuesta([tarjeta(1), tarjeta(2)]);
  return respuesta({ error: 'no' }, 404);
};
localStorage.setItem('token', 'prueba');

const { createServer } = await import('vite');
const react = (await import('@vitejs/plugin-react')).default;
const vite = await createServer({ root: process.cwd(), configFile: false, plugins: [react()], server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const { render, screen, fireEvent, act, cleanup, within } = await import('@testing-library/react');
const { MemoryRouter, Routes, Route } = await import('react-router-dom');
const { createElement: h } = await import('react');
const cargar = (p) => vite.ssrLoadModule(p);
const { AuthProvider } = await cargar('/src/context/AuthContext.jsx');
const { RequireAuth } = await cargar('/src/components/RutasAuth.jsx');
const Asistente = (await cargar('/src/pages/Asistente.jsx')).default;
const Home = (await cargar('/src/pages/Home.jsx')).default;
const Buscar = (await cargar('/src/pages/Buscar.jsx')).default;
const Tarjeta = (await cargar('/src/components/productos/TarjetaProducto.jsx')).default;
const espera = (ms = 80) => act(() => new Promise((r) => setTimeout(r, ms)));
const ok = (m) => console.log('ok', m);

async function abrir(ruta = '/asistente', { limpiar = true } = {}) {
  cleanup(); llamadas.length = 0; if (limpiar) sessionStorage.clear();
  await act(async () => {
    render(h(MemoryRouter, { initialEntries: [ruta] }, h(AuthProvider, null, h(Routes, null, h(Route, { element: h(RequireAuth) },
      h(Route, { path: '/asistente', element: h(Asistente) }), h(Route, { path: '/buscar', element: h(Buscar) }), h(Route, { path: '/', element: h(Home) }), h(Route, { path: '/producto/:id', element: h('p', null, 'Detalle') }))))));
  });
  await espera(150);
}
const campo = () => screen.getByLabelText('Escribe tu pregunta');
const escribir = (v) => act(async () => { fireEvent.change(campo(), { target: { value: v } }); });
const enviarForm = async () => { await act(async () => { fireEvent.submit(campo().closest('form')); }); await espera(); };
const preguntar = async (v) => { await escribir(v); await enviarForm(); };
const chatLlamadas = () => llamadas.filter((l) => l.ruta === '/api/chatbot');
const guardado = () => JSON.parse(sessionStorage.getItem('foodcenter:chat:u1') ?? '[]');

// ---------- estado inicial ----------
await abrir();
assert.ok(screen.getByRole('heading', { name: 'Asistente de FoodCenter' })); assert.ok(screen.getByText(/Hola, soy el asistente de FoodCenter/)); assert.equal(screen.getByLabelText('Volver').getAttribute('href'), '/');
assert.equal(within(screen.getByLabelText('Preguntas sugeridas')).getAllByRole('button').length, 4); assert.ok(screen.getByText(/Respuestas generadas por IA: pueden tener errores/)); assert.equal(screen.queryByText('Nueva conversación'), null);
assert.equal(campo().maxLength, 500); assert.equal(screen.getByRole('button', { name: 'Enviar' }).disabled, true); assert.equal(chatLlamadas().length, 0);
ok('al abrir: bienvenida, 4 preguntas sugeridas, aviso de que es IA, límite de 500 caracteres y "Enviar" bloqueado; no llama al servidor');

// ---------- primera pregunta con productos ----------
chat = () => respuesta({ respuesta: 'Te recomiendo estos:', productos: [tarjeta(1, { calificacion: { promedio: 4.5, total: 2 } }), tarjeta(2, { estadoVenta: 'FUERA_DE_HORARIO' })] });
await act(async () => { fireEvent.click(screen.getByText('Recomiéndame algo con pollo')); }); await espera();
assert.deepEqual(chatLlamadas()[0].cuerpo, { mensaje: 'Recomiéndame algo con pollo', historial: [] });
assert.ok(screen.getByText('Recomiéndame algo con pollo')); assert.ok(screen.getByText('Te recomiendo estos:')); assert.equal(screen.queryByLabelText('Preguntas sugeridas'), null);
const enlaces = screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('/producto/')); assert.deepEqual(enlaces.map((a) => a.getAttribute('href')), ['/producto/id-1', '/producto/id-2']);
assert.ok(enlaces[0].textContent.includes('Producto 1') && enlaces[0].textContent.includes('10.000') && enlaces[0].textContent.includes('4,5')); assert.ok(enlaces[1].textContent.includes('Fuera de horario'));
ok('una sugerencia envía la pregunta; la respuesta muestra tarjetas con enlace al producto, precio, calificación y estado');
assert.ok(screen.getByText('Nueva conversación')); assert.equal(guardado().length, 2); assert.equal(guardado()[1].productos.length, 2); ok('la conversación se guarda en esta pestaña (sessionStorage)');

// ---------- segunda pregunta y historial ----------
chat = () => respuesta({ respuesta: 'Está abierto hasta las 6.', productos: [] });
await preguntar('  ¿y hasta qué hora?  ');
assert.deepEqual(chatLlamadas().at(-1).cuerpo, { mensaje: '¿y hasta qué hora?', historial: [{ rol: 'usuario', texto: 'Recomiéndame algo con pollo' }, { rol: 'asistente', texto: 'Te recomiendo estos:' }] });
assert.equal(campo().value, ''); ok('el historial viaja sin tarjetas, el texto se recorta y el campo se limpia');
for (let i = 0; i < 4; i++) await preguntar('pregunta ' + i);
assert.equal(chatLlamadas().at(-1).cuerpo.historial.length, 6); ok('al servidor solo se envían los últimos 6 turnos');

// ---------- enviando ----------
await abrir(); demora = 300; chat = () => respuesta({ respuesta: 'Listo', productos: [] });
await escribir('hola'); await act(async () => { fireEvent.submit(campo().closest('form')); }); await espera(30);
assert.ok(screen.getByRole('status').textContent.includes('Escribiendo')); assert.equal(campo().disabled, true); assert.equal(screen.getByRole('button', { name: 'Enviar' }).disabled, true);
await espera(400); assert.equal(screen.queryByText(/Escribiendo/), null); assert.equal(campo().disabled, false); assert.ok(screen.getByText('Listo')); demora = 0;
ok('mientras responde: indicador "Escribiendo…" y campo bloqueado; luego todo se libera');
await escribir('   '); assert.equal(screen.getByRole('button', { name: 'Enviar' }).disabled, true); await enviarForm(); assert.equal(chatLlamadas().length, 1); ok('no se envían mensajes vacíos o de solo espacios');

// ---------- errores ----------
await abrir(); chat = () => respuesta({ error: 'El asistente no está disponible por ahora.' }, 503);
await preguntar('¿qué hay de comer?');
assert.ok(screen.getByRole('alert').textContent.includes('no está disponible por ahora')); assert.equal(campo().value, '¿qué hay de comer?'); assert.equal(screen.queryAllByText('¿qué hay de comer?').length, 0, 'la burbuja de la pregunta fallida se retira'); assert.ok(screen.getByLabelText('Preguntas sugeridas')); assert.equal(guardado().length, 0);
ok('error 503: se muestra el aviso, la pregunta vuelve al campo para reintentar y no queda guardada');
chat = () => respuesta({ respuesta: 'Ahora sí', productos: [] }); await enviarForm(); assert.ok(screen.getByText('Ahora sí')); assert.equal(screen.queryByRole('alert'), null); assert.deepEqual(chatLlamadas().at(-1).cuerpo.historial, []); ok('reintentar con la misma pregunta funciona y limpia el error');
chat = () => respuesta({ error: 'Hiciste muchas preguntas seguidas. Espera un rato y vuelve a intentarlo.' }, 429); await preguntar('otra'); assert.ok(screen.getByRole('alert').textContent.includes('muchas preguntas seguidas')); ok('límite de preguntas (429): se muestra el aviso del servidor');
const falla = globalThis.fetch; globalThis.fetch = async (u, o) => { if (String(u).includes('/chatbot')) throw new Error('sin red'); return falla(u, o); }; await preguntar('hola'); assert.ok(screen.getByRole('alert').textContent.includes('No se pudo conectar')); globalThis.fetch = falla; ok('sin conexión: "No se pudo conectar con el servidor"');

// ---------- seguridad del contenido ----------
await abrir(); chat = () => respuesta({ respuesta: '<img src=x onerror=alert(1)> <b>negrita</b> [enlace](http://malo.com)', productos: [] });
await preguntar('prueba'); assert.equal(document.querySelectorAll('img[src="x"]').length, 0); assert.equal(document.querySelectorAll('b').length, 0); assert.ok(screen.getByText(/<img src=x onerror=alert\(1\)> <b>negrita<\/b>/)); ok('la respuesta se muestra como texto plano: el HTML del modelo no se interpreta');

// ---------- nueva conversación y persistencia ----------
chat = () => respuesta({ respuesta: 'Hola de nuevo', productos: [] });
await abrir(); await preguntar('uno'); await preguntar('dos'); assert.equal(guardado().length, 4);
await abrir('/asistente', { limpiar: false }); assert.ok(screen.getByText('uno') && screen.getByText('dos')); assert.equal(screen.queryByLabelText('Preguntas sugeridas'), null); ok('al volver (p. ej. desde un producto) la conversación sigue ahí');
usuarioActual = 'u2'; await abrir('/asistente', { limpiar: false }); assert.equal(screen.queryByText('uno'), null); assert.ok(screen.getByLabelText('Preguntas sugeridas')); ok('otro usuario en el mismo navegador no ve la conversación');
usuarioActual = 'u1'; await abrir('/asistente', { limpiar: false }); await act(async () => { fireEvent.click(screen.getByText('Nueva conversación')); });
assert.equal(screen.queryByText('uno'), null); assert.ok(screen.getByLabelText('Preguntas sugeridas')); assert.equal(sessionStorage.getItem('foodcenter:chat:u1'), null); assert.equal(screen.queryByText('Nueva conversación'), null); ok('"Nueva conversación" borra mensajes y almacenamiento y vuelve a las sugerencias');
sessionStorage.setItem('foodcenter:chat:u1', 'no es json'); await abrir('/asistente', { limpiar: false }); assert.ok(screen.getByLabelText('Preguntas sugeridas'));
sessionStorage.setItem('foodcenter:chat:u1', JSON.stringify([{ rol: 'hacker', texto: 'x' }, { rol: 'usuario' }, null, { rol: 'usuario', texto: 'válido' }])); await abrir('/asistente', { limpiar: false }); assert.ok(screen.getByText('válido')); assert.equal(screen.queryByText('hacker'), null); ok('almacenamiento dañado o manipulado: se ignora lo inválido sin errores');

// ---------- Home: botón y pestaña ----------
await abrir('/');
assert.equal(screen.getByLabelText('Abrir asistente').getAttribute('href'), '/asistente'); assert.equal(screen.getAllByRole('tab').length, 9); assert.equal(screen.getAllByRole('tab')[1].textContent, 'Recomendado por IA'); ok('Principal: el ícono del robot es un enlace a /asistente y hay 9 pestañas, con "Recomendado por IA" en segundo lugar');
recomendados = () => respuesta({ origen: 'ia', productos: [tarjeta(1, { motivo: 'Muy bien calificado' }), tarjeta(2, { motivo: 'Opción económica' })] });
llamadas.length = 0; await act(async () => { fireEvent.click(screen.getByRole('tab', { name: 'Recomendado por IA' })); }); await espera();
assert.deepEqual(llamadas.map((l) => l.ruta), ['/api/chatbot/recomendados']); assert.ok(screen.getByText('Muy bien calificado') && screen.getByText('Opción económica')); assert.ok(screen.getByText('Selección del asistente de IA.')); assert.equal(screen.getByRole('tab', { name: 'Recomendado por IA' }).getAttribute('aria-selected'), 'true'); ok('pestaña "Recomendado por IA": consulta /chatbot/recomendados y muestra cada producto con su motivo');
recomendados = () => respuesta({ origen: 'respaldo', productos: [tarjeta(3)] }); await act(async () => { fireEvent.click(screen.getByRole('tab', { name: 'Todos' })); }); await espera(); await act(async () => { fireEvent.click(screen.getByRole('tab', { name: 'Recomendado por IA' })); }); await espera();
assert.ok(screen.getByText(/el asistente de IA no está disponible en este momento/)); ok('con selección de respaldo, se avisa que la IA no está disponible');
recomendados = () => respuesta({ origen: 'respaldo', productos: [] }); await act(async () => { fireEvent.click(screen.getByRole('tab', { name: 'Todos' })); }); await espera(); await act(async () => { fireEvent.click(screen.getByRole('tab', { name: 'Recomendado por IA' })); }); await espera(); assert.ok(screen.getByText('Aún no hay productos para recomendar.')); ok('sin productos para recomendar: mensaje vacío');
recomendados = () => respuesta({ error: 'Demasiadas consultas. Espera un rato y vuelve a intentarlo.' }, 429); await act(async () => { fireEvent.click(screen.getByRole('tab', { name: 'Todos' })); }); await espera(); await act(async () => { fireEvent.click(screen.getByRole('tab', { name: 'Recomendado por IA' })); }); await espera(); assert.ok(screen.getByRole('alert').textContent.includes('Demasiadas consultas')); ok('error al pedir recomendados: se muestra el aviso');
await act(async () => { fireEvent.click(screen.getByRole('tab', { name: 'Todos' })); }); await espera(); assert.equal(llamadas.at(-1).ruta, '/api/productos'); assert.equal(screen.queryByText(/Selección del asistente/), null); ok('volver a "Todos" usa el catálogo normal y quita la nota');

// ---------- Buscar sin la pestaña de IA; tarjeta con motivo ----------
await abrir('/buscar'); assert.equal(screen.getAllByRole('tab').length, 8); assert.equal(screen.queryByRole('tab', { name: 'Recomendado por IA' }), null); ok('la pantalla de búsqueda no incluye "Recomendado por IA" (8 pestañas)');
cleanup(); await act(async () => { render(h(MemoryRouter, null, h(Tarjeta, { producto: tarjeta(1, { motivo: 'Muy bien calificado' }) }))); }); assert.ok(screen.getByText('Muy bien calificado')); cleanup();
await act(async () => { render(h(MemoryRouter, null, h(Tarjeta, { producto: tarjeta(1) }))); }); assert.equal(screen.queryByText('Muy bien calificado'), null); ok('la tarjeta muestra el motivo solo cuando existe');

cleanup(); await vite.close(); window.close();
