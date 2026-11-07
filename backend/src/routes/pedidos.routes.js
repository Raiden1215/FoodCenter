import { Router } from 'express';
import * as ctl from '../controllers/pedido.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validar } from '../middlewares/validate.middleware.js';
import { cambiarEstadoPedidoSchema, crearPedidoSchema } from '../schemas/pedido.schema.js';

const router = Router();

router.use(requireAuth);

router.post('/', validar(crearPedidoSchema), ctl.crear);
router.get('/mi-local', ctl.listarLocal);
router.get('/mis-pedidos', ctl.listarMisPedidos);
router.get('/:id', ctl.obtener);
router.patch('/:id/estado', validar(cambiarEstadoPedidoSchema), ctl.cambiarEstado);

export default router;
