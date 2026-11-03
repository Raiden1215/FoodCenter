import { Router } from 'express';
import * as ctl from '../controllers/busqueda.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validar } from '../middlewares/validate.middleware.js';
import { busquedaSchema } from '../schemas/busqueda.schema.js';

const router = Router();
router.use(requireAuth);

router.get('/', ctl.listar);
router.post('/', validar(busquedaSchema), ctl.registrar);
router.delete('/:id', ctl.eliminar);
router.delete('/', ctl.vaciar);

export default router;
