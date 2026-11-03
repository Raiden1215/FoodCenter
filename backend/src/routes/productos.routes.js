import { Router } from 'express';
import * as ctl from '../controllers/producto.controller.js';
import * as resenas from '../controllers/resena.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validar, validarConsulta } from '../middlewares/validate.middleware.js';
import { consultaCatalogoSchema } from '../schemas/busqueda.schema.js';
import { productoSchema } from '../schemas/producto.schema.js';
import { resenaSchema } from '../schemas/resena.schema.js';

const router = Router();
router.use(requireAuth);

router.get('/', validarConsulta(consultaCatalogoSchema), ctl.catalogo);
router.get('/mios', ctl.listarMios); // antes que '/:id'
router.get('/:id', ctl.detalle);
router.get('/:id/resenas', resenas.listar);
router.put('/:id/resenas', validar(resenaSchema), resenas.guardar); // crea o actualiza mi reseña
router.delete('/:id/resenas', resenas.eliminar); // elimina mi reseña
router.post('/', validar(productoSchema), ctl.crear);
router.put('/:id', validar(productoSchema), ctl.actualizar);
router.delete('/:id', ctl.eliminar);

export default router;
