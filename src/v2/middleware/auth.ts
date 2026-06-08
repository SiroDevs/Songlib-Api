import { Request, Response, NextFunction } from 'express';

/**
 * Protects write operations (POST, PUT, DELETE) with an API key.
 * GET requests are public and skip this middleware.
 * Set API_KEY in your .env file.
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const readMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (readMethods.includes(req.method)) {
    return next();
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      status: 500,
      error: 'Server misconfigured: API_KEY environment variable is not set',
    });
  }

  const providedKey = req.headers['x-api-key'];
  if (!providedKey || providedKey !== apiKey) {
    return res.status(401).json({
      status: 401,
      error: 'Unauthorized: missing or invalid API key',
    });
  }

  next();
}
