import express, { Router } from 'express';
import * as ctl from '../controllers/upload.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// La imagen se envía como cuerpo binario (sin multipart): Content-Type image/jpeg, image/png o image/webp.
router.post(
  '/',
  requireAuth,
  express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '5mb' }),
  ctl.subir
);

export default router;
