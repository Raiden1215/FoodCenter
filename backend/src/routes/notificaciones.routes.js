import { Router } from 'express';
import * as ctl from '../controllers/notificacion.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(requireAuth);

router.get('/', ctl.listar);
router.patch('/:id/leida', ctl.marcarLeida);

export default router;
