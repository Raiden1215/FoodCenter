import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/error.middleware.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Fotos subidas por los usuarios
app.use('/uploads', express.static(env.uploadsDir, { index: false, maxAge: '7d' }));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
