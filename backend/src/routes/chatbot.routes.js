import { Router } from 'express';
import * as ctl from '../controllers/chatbot.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validar } from '../middlewares/validate.middleware.js';
import { chatbotSchema } from '../schemas/chatbot.schema.js';
import { limitarPorUsuario } from '../utils/limitador.js';

const router = Router();
router.use(requireAuth);

const HORA = 3_600_000;
const limitarChat = limitarPorUsuario({ max: 30, ventanaMs: HORA, mensaje: 'Hiciste muchas preguntas seguidas. Espera un rato y vuelve a intentarlo.' });
const limitarRecomendados = limitarPorUsuario({ max: 60, ventanaMs: HORA, mensaje: 'Demasiadas consultas. Espera un rato y vuelve a intentarlo.' });

router.post('/', limitarChat, validar(chatbotSchema), ctl.conversar);
router.get('/recomendados', limitarRecomendados, ctl.recomendados);

export default router;
