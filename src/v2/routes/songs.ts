import { Router, Request, Response, NextFunction } from 'express';
import { SongService } from '../services/songService';
import { ResponseUtils } from '../utils/responseUtils';
import { ValidationUtils } from '../utils/validationUtils';
import { requireApiKey } from '../middleware/auth';
import { readLimiter, writeLimiter, bulkLimiter } from '../middleware/rateLimit';

const router = Router();

router.use(requireApiKey);

/**
 * GET /api/v2/songs/:songId
 * Fetch a single song by its ID.
 */
router.get('/:songId', readLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const songId = parseInt(req.params.songId);
    if (!ValidationUtils.isValidId(songId)) {
      return ResponseUtils.badRequest(res, 'Invalid songId');
    }

    const song = await SongService.getSongById(songId);
    if (!song) {
      return ResponseUtils.notFound(res, 'Song not found');
    }

    ResponseUtils.success(res, song);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v2/songs/books/:bookIds
 * Fetch songs for one or more books with pagination and delta sync.
 *
 * Query params:
 *   ?page=1          — page number (default: 1)
 *   ?limit=500        — results per page (default: 500, max: 1000)
 *   ?since=<ISODate>  — only return songs updated after this date (delta sync)
 *
 * Example:
 *   /api/v2/songs/books/1,3,7?since=2025-01-01T00:00:00Z
 */
router.get('/books/:bookIds', readLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookIds = ValidationUtils.parseBookIds(req.params.bookIds);
    if (bookIds.length === 0) {
      return ResponseUtils.badRequest(res, 'No valid book IDs provided');
    }

    const { page, limit } = ValidationUtils.parsePagination(req.query);
    const since = req.query.since as string | undefined;

    const result = await SongService.getSongsByBookIds(bookIds, { page, limit, since });

    if (result.songs.length === 0 && !since) {
      return ResponseUtils.notFound(res, 'No songs found for the specified books');
    }

    ResponseUtils.paginated(res, result.songs, result.pagination);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v2/songs
 * Create one song (object body) or many (array body).
 */
router.post('/', bulkLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (ValidationUtils.isBulkOperation(req.body)) {
      const { createdSongs, errors } = await SongService.createMultipleSongs(req.body);
      return ResponseUtils.bulkResult(res, 'songs', createdSongs, errors, 201);
    }

    const validationError = ValidationUtils.validateSongData(req.body);
    if (validationError) {
      return ResponseUtils.badRequest(res, validationError);
    }

    const song = await SongService.createSingleSong(req.body);
    ResponseUtils.created(res, song);
  } catch (error: any) {
    if (error.code === 11000 || error.code === 'DUPLICATE_SONG') {
      return ResponseUtils.conflict(res, error.message || 'Duplicate record');
    }
    next(error);
  }
});

/**
 * PUT /api/v2/songs
 * Update one song (object body, requires songId) or many (array body).
 *
 * v1 bug fixed: v1 had two router.put("/") handlers — the second was
 * unreachable. This single handler covers both bulk and single updates.
 */
router.put('/', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (ValidationUtils.isBulkOperation(req.body)) {
      const { updateResults, errors } = await SongService.updateMultipleSongs(req.body);
      return ResponseUtils.bulkResult(res, 'songs', updateResults, errors);
    }

    if (!req.body.songId || !req.body.title) {
      return ResponseUtils.badRequest(res, 'songId and title are required');
    }

    const song = await SongService.updateSong(req.body.songId, req.body);
    if (!song) {
      return ResponseUtils.notFound(res, 'Song not found');
    }

    ResponseUtils.success(res, song);
  } catch (error: any) {
    if (error.code === 11000) {
      return ResponseUtils.conflict(res, 'Duplicate record');
    }
    next(error);
  }
});

/**
 * DELETE /api/v2/songs/:songId
 */
router.delete('/:songId', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const songId = parseInt(req.params.songId);
    if (!ValidationUtils.isValidId(songId)) {
      return ResponseUtils.badRequest(res, 'Invalid songId');
    }

    const result = await SongService.deleteSong(songId);
    if (result.deletedCount === 0) {
      return ResponseUtils.notFound(res, 'Song not found');
    }

    ResponseUtils.success(res, { message: 'Song deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ── Per-user likes ──────────────────────────────────────────────────────────

/**
 * POST /api/v2/songs/likes/toggle
 * Toggle a like for a user on a song. Idempotent — like again to unlike.
 * Body: { userId: number, songId: number }
 */
router.post('/likes/toggle', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, songId } = req.body;
    if (!userId || !songId) {
      return ResponseUtils.badRequest(res, 'userId and songId are required');
    }

    const result = await SongService.toggleLike(Number(userId), Number(songId));
    ResponseUtils.success(res, result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v2/songs/likes/:userId
 * Returns all songIds liked by a given user.
 */
router.get('/likes/:userId', readLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.userId);
    if (!ValidationUtils.isValidId(userId)) {
      return ResponseUtils.badRequest(res, 'Invalid userId');
    }

    const songIds = await SongService.getLikedSongIds(userId);
    ResponseUtils.success(res, { userId, likedSongIds: songIds });
  } catch (error) {
    next(error);
  }
});

export default router;
