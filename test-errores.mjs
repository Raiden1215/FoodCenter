import { mock } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
process.env.JWT_SECRET = 'prueba'; process.env.UPLOADS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'up-'));
const u = (p) => pathToFileURL(path.resolve('src', p)).href;
const consolaError = console.error; const registro = []; console.error = (...a) => registro.push(a.join(' '));
mock.module(u('lib/prisma.js'), { namedExports: { prisma: {
  usuario: { async findUnique() { throw new Error('la base de datos se cayó (detalle interno secreto)'); } },
  async $queryRaw() { return [1]; },
} } });
const { default: app } = await import(u('app.js')); const { firmarToken } = await import(u('utils/token.js'));
const { HttpError } = await import(u('utils/httpError.js'));
const srv = app.listen(0); const base = `http://localhost:${srv.address().port}`; const tok = firmarToken('x');
const ok = (m) => console.log('ok', m);
const json = (p, body) => fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) });

let r = await json('/api/auth/login', '{malo'); assert.equal(r.status, 400); assert.equal((await r.json()).error, 'El cuerpo de la petición no es un JSON válido'); ok('JSON inválido: 400 con mensaje en español');
r = await fetch(base + '/api/uploads', { method: 'POST', headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'image/jpeg' }, body: Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(6 * 1024 * 1024)]) });
assert.equal(r.status, 413); assert.equal((await r.json()).error, 'El archivo es demasiado grande (máximo 5 MB)'); ok('archivo grande: 413 con mensaje en español');
r = await fetch(base + '/api/no-existe'); assert.equal(r.status, 404); assert.equal((await r.json()).error, 'Ruta no encontrada'); ok('ruta inexistente: 404');
r = await json('/api/auth/login', { correo: 'a@x.com', password: 'clave1234' }); const cuerpo = await r.json();
assert.equal(r.status, 500); assert.equal(cuerpo.error, 'Error interno del servidor'); assert.ok(!JSON.stringify(cuerpo).includes('secreto')); assert.ok(registro.some((l) => l.includes('detalle interno secreto'))); ok('error inesperado: el cliente solo ve "Error interno del servidor" y el detalle queda solo en el registro');
r = await fetch(base + '/api/auth/me', { headers: { Authorization: 'Bearer basura' } }); assert.equal(r.status, 401); ok('sesión inválida: 401');
r = await fetch(base + '/api/health'); assert.equal(r.status, 200);
for (const ruta of ['auth/me', 'locales/mio', 'productos', 'busquedas', 'chatbot/recomendados']) { const x = await fetch(`${base}/api/${ruta}`); assert.equal(x.status, 401, ruta); }
ok('todas las rutas (incluida /api/chatbot) están montadas y exigen sesión');
const e = new HttpError(503, 'Aviso para el usuario'); assert.equal(e.status, 503); ok('HttpError conserva su estado');
srv.close(); console.error = consolaError;
