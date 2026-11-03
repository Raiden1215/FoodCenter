import * as authService from '../services/auth.service.js';
import * as recuperacionService from '../services/recuperacion.service.js';

export async function registro(req, res) {
  res.status(201).json(await authService.registrar(req.body));
}

export async function login(req, res) {
  res.json(await authService.iniciarSesion(req.body));
}

export async function perfil(req, res) {
  res.json(await authService.obtenerPerfil(req.usuarioId));
}

// La respuesta es la misma exista o no el correo.
export async function solicitarRecuperacion(req, res) {
  await recuperacionService.solicitarCodigo(req.body.correo);
  res.json({ mensaje: 'Si el correo está registrado, te enviamos un código para recuperar tu contraseña.' });
}

export async function verificarCodigo(req, res) {
  res.json(await recuperacionService.verificarCodigo(req.body.correo, req.body.codigo));
}

export async function restablecer(req, res) {
  await recuperacionService.restablecerPassword(req.body.token, req.body.password);
  res.json({ mensaje: 'Tu contraseña se actualizó. Ya puedes iniciar sesión.' });
}
