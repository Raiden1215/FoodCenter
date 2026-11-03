import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validar } from '../middlewares/validate.middleware.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { registroSchema, loginSchema, recuperarSchema, codigoSchema, nuevaPasswordSchema } from '../schemas/auth.schema.js';

const router = Router();

router.post('/registro', validar(registroSchema), authController.registro);
router.post('/login', validar(loginSchema), authController.login);
router.get('/me', requireAuth, authController.perfil);

// Recuperación de contraseña: 1) pedir código, 2) verificarlo, 3) definir la nueva contraseña
router.post('/recuperar', validar(recuperarSchema), authController.solicitarRecuperacion);
router.post('/recuperar/codigo', validar(codigoSchema), authController.verificarCodigo);
router.post('/recuperar/nueva', validar(nuevaPasswordSchema), authController.restablecer);

export default router;
