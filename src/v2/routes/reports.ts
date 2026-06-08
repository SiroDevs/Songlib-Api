import { Router, Request, Response, NextFunction } from 'express';
import { SongService } from '../services/songService';
import { ResponseUtils } from '../utils/responseUtils';
import { ValidationUtils } from '../utils/validationUtils';
import { requireApiKey } from '../middleware/auth';
import { readLimiter, writeLimiter } from '../middleware/rateLimit';

const router = Router();

router.use(requireApiKey);

/**
 * POST /api/v2/reports
 * Submit a song error report from within the app.
 * No auth key needed for reporting — any user should be able to report.
 *
 * Body:
 * {
 *   songId: number,
 *   bookId: number,
 *   songNo: number,
 *   songTitle: string,
 *   reportType: "typo" | "missing_verse" | "wrong_song" | "wrong_number" | "other",
 *   description: string,
 *   reportedBy?: string  // optional device ID or username
 * }
 */
router.post('/', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationError = ValidationUtils.validateReportData(req.body);
    if (validationError) {
      return ResponseUtils.badRequest(res, validationError);
    }

    const report = await SongService.createReport(req.body);
    ResponseUtils.created(res, {
      message: 'Report submitted. Thank you for helping improve SongLib!',
      reportId: report.reportId,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v2/reports
 * List all reports. Admin use only — protected by API key.
 * ?resolved=true   — filter to resolved reports only
 * ?resolved=false  — filter to unresolved reports only
 * (omit ?resolved to get all)
 */
router.get('/', readLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resolvedParam = req.query.resolved;
    const resolved =
      resolvedParam === 'true' ? true : resolvedParam === 'false' ? false : undefined;

    const reports = await SongService.getReports(resolved);
    ResponseUtils.success(res, reports);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v2/reports/:reportId/resolve
 * Mark a report as resolved. Admin use only.
 */
router.put('/:reportId/resolve', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reportId = parseInt(req.params.reportId as string);
    if (!ValidationUtils.isValidId(reportId)) {
      return ResponseUtils.badRequest(res, 'Invalid reportId');
    }

    const report = await SongService.resolveReport(reportId);
    if (!report) {
      return ResponseUtils.notFound(res, 'Report not found');
    }

    ResponseUtils.success(res, { message: 'Report marked as resolved', report });
  } catch (error) {
    next(error);
  }
});

export default router;
