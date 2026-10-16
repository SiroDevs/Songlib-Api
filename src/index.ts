import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';

import { Analytics } from "@vercel/analytics/next"

// v2 swagger docs
import swaggerRouter from './v2/swagger';

// v2 routes
import {
  health,
  books as booksV2,
  songs as songsV2,
  users as usersV2,
  drafts as draftsV2,
  edits as editsV2,
  listings as listingsV2,
  organisations as organisationsV2,
  reports,
} from './v2/routes';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: './.env' });
}

const app = express();

// Required when running behind a reverse proxy (Vercel, Render, etc.).
// Without this, express-rate-limit throws on every request because it
// can't safely trust the X-Forwarded-For header, which was surfacing
// as a 500 on every rate-limited route (i.e. almost all of them).
app.set('trust proxy', 1);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['*'];

app.use(
  cors({
    origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-api-key'],
  })
);

// ── DB ────────────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.ATLAS_URI as string, { authSource: 'admin' })
  .then(() => console.log('MongoDB connected ...'))
  .catch((err) => console.error('MongoDB connection error:', err));

// gzip responses: song lyrics are large, repetitive text and compress ~5-8x.
app.use(compression());

app.use(express.json({ limit: '50mb' }));

// ── v2 routes 
app.use('/api/v2', swaggerRouter);
app.use('/api/v2/health', health);
app.use('/api/v2/books', booksV2);
app.use('/api/v2/songs', songsV2);
app.use('/api/v2/users', usersV2);
app.use('/api/v2/drafts', draftsV2);
app.use('/api/v2/edits', editsV2);
app.use('/api/v2/listings', listingsV2);
app.use('/api/v2/organisations', organisationsV2);
app.use('/api/v2/reports', reports);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ status: 500, error: 'Internal server error' });
});

export default app;

if (process.env.VERCEL !== '1' && require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`SongLib server running on port ${PORT}`));
}
