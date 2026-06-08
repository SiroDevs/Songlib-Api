import rateLimit from 'express-rate-limit';

const rateLimitMessage = (max: number, windowMinutes: number) => ({
  status: 429,
  error: `Too many requests — limit is ${max} per ${windowMinutes} minutes. Please slow down.`,
});

/**
 * Generous limit for public read endpoints (GET songs, books).
 * 300 requests per 15 minutes per IP.
 */
export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: rateLimitMessage(300, 15),
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Stricter limit for write endpoints (POST, PUT, DELETE).
 * 60 requests per 15 minutes per IP.
 */
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: rateLimitMessage(60, 15),
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Tight limit specifically for bulk operations
 * (e.g. seeding hundreds of songs).
 * 10 bulk requests per 15 minutes per IP.
 */
export const bulkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: rateLimitMessage(10, 15),
  standardHeaders: true,
  legacyHeaders: false,
});
