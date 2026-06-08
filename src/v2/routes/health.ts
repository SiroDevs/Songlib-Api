import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

const connectionStateLabel: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

/**
 * GET /api/v2/health
 * Returns the server and database status.
 * Safe for uptime monitors — never throws, always responds.
 */
router.get('/', (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = connectionStateLabel[dbState] ?? 'unknown';
  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 200 : 503,
    api: 'v2',
    server: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

export default router;
