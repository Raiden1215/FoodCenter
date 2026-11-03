import { Router } from 'express';
import * as ctl from '../controllers/local.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validar } from '../middlewares/validate.middleware.js';
import { estadoSchema, localSchema } from '../schemas/local.schema.js';

const router = Router();
router.use(requireAuth);

router.get('/mio', ctl.obtenerMio);
router.post('/', validar(localSchema), ctl.crear);
router.put('/mio', validar(localSchema), ctl.actualizar);
router.patch('/mio/estado', validar(estadoSchema), ctl.cambiarEstado);

export default router;
