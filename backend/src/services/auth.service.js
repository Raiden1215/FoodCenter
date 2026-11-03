import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/httpError.js';
import { firmarToken } from '../utils/token.js';

const SALT_ROUNDS = 10;

// Datos que se pueden devolver al cliente (nunca el hash de la contraseña).
const SELECT_PUBLICO = {
  id: true,
  nombre: true,
  correo: true,
  direccion: true,
  latitud: true,
  longitud: true,
  creadoEn: true,
};

// Hash de relleno: permite comparar igual aunque el correo no exista, para no revelar
// por tiempo de respuesta qué correos están registrados.
const HASH_RELLENO = bcrypt.hashSync('relleno-no-usar', SALT_ROUNDS);

export async function registrar({ nombre, correo, password, direccion, latitud, longitud }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const usuario = await prisma.usuario.create({
      data: { nombre, correo, passwordHash, direccion, latitud, longitud },
      select: SELECT_PUBLICO,
    });
    return { token: firmarToken(usuario.id), usuario };
  } catch (err) {
    if (err.code === 'P2002') throw new HttpError(409, 'Ya existe una cuenta con ese correo');
    throw err;
  }
}

export async function iniciarSesion({ correo, password }) {
  const registro = await prisma.usuario.findUnique({ where: { correo } });
  const coincide = await bcrypt.compare(password, registro?.passwordHash ?? HASH_RELLENO);

  if (!registro || !coincide) throw new HttpError(401, 'Correo o contraseña incorrectos');

  const { passwordHash: _omitido, ...usuario } = registro;
  return { token: firmarToken(usuario.id), usuario };
}

export async function obtenerPerfil(usuarioId) {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: SELECT_PUBLICO });
  if (!usuario) throw new HttpError(401, 'Sesión inválida o expirada');
  return usuario;
}
