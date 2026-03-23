import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/error-handler.js';
import { apiLimiter } from './middleware/rate-limit.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { vaultRoutes } from './modules/vault/vault.routes.js';
import { tokenRoutes } from './modules/tokens/token.routes.js';
import { tokenAuthRoutes } from './modules/tokens/token.auth.routes.js';
import { sharingRoutes } from './modules/sharing/sharing.routes.js';

export const app = express();

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins for the API (password manager needs to work everywhere)
    // Capacitor: capacitor://localhost, http://localhost
    // Extension: chrome-extension://...
    // Web: https://syntropass.de
    // Electron: file:// or https://syntropass.de
    callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/api', apiLimiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/vaults', vaultRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/sharing', sharingRoutes);
app.use('/api/v1/token', tokenAuthRoutes);

app.use(errorHandler);
