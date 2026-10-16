import { Request, Response, NextFunction } from 'express';

/**
 * Marks a GET response as cacheable by Vercel's edge network.
 *
 * `s-maxage` applies to shared caches (the CDN) only, so a cache hit never
 * reaches the function and does not count towards Fast Origin Transfer.
 * `stale-while-revalidate` lets the edge keep serving the old copy while it
 * refreshes in the background.
 *
 * Only use this on responses that are identical for every user.
 */
export function edgeCache(sMaxAgeSeconds: number, staleWhileRevalidateSeconds = 0) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET') {
      const swr = staleWhileRevalidateSeconds > 0
        ? `, stale-while-revalidate=${staleWhileRevalidateSeconds}`
        : '';
      res.setHeader('Cache-Control', `public, max-age=0, s-maxage=${sMaxAgeSeconds}${swr}`);
    }
    next();
  };
}
