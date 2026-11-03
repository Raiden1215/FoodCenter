import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import localesRoutes from './locales.routes.js';
import productosRoutes from './productos.routes.js';
import uploadsRoutes from './uploads.routes.js';
import busquedasRoutes from './busquedas.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/locales', localesRoutes);
router.use('/productos', productosRoutes);
router.use('/uploads', uploadsRoutes);
router.use('/busquedas', busquedasRoutes);
// Próximos módulos: pedidos, chatbot...

export default router;
