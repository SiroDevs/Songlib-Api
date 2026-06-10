import { Router, Request, Response, NextFunction } from 'express';
import { Edit, Acounter } from '../models';
import { ResponseUtils } from '../utils/responseUtils';
import { requireApiKey } from '../middleware/auth';
import { readLimiter, writeLimiter } from '../middleware/rateLimit';

const router = Router();

router.use(requireApiKey);

/** GET /api/v2/edits */
router.get('/', readLimiter, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const edits = await Edit.find({}).select('-_id').sort({ created: -1 });
    ResponseUtils.success(res, edits);
  } catch (error) {
    next(error);
  }
});

/** GET /api/v2/edits/pending  — admin: all edits awaiting review */
router.get('/pending', readLimiter, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const edits = await Edit.find({ status: 'pending' }).select('-_id').sort({ created: -1 });
    ResponseUtils.success(res, edits);
  } catch (error) {
    next(error);
  }
});

/** GET /api/v2/edits/user/:userId  — edits submitted by a specific user */
router.get('/user/:userId', readLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) return ResponseUtils.badRequest(res, 'Invalid userId');

    const edits = await Edit.find({ userId }).select('-_id').sort({ created: -1 });
    ResponseUtils.success(res, edits);
  } catch (error) {
    next(error);
  }
});

/** GET /api/v2/edits/:editId */
router.get('/:editId', readLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const edit = await Edit.findOne({ editId: parseInt(req.params.editId) }).select('-_id');
    if (!edit) {
      return ResponseUtils.notFound(res, 'Edit not found');
    }
    ResponseUtils.success(res, edit);
  } catch (error) {
    next(error);
  }
});

/** POST /api/v2/edits  — user submits a song edit */
router.post('/', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body.title) {
      return ResponseUtils.badRequest(res, 'title is required');
    }

    const counter = await Acounter.findOneAndUpdate(
      { _id: 'edits' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    req.body.editId = counter!.seq;
    req.body.status = 'pending';
    const edit = await Edit.create(req.body);
    ResponseUtils.created(res, edit);
  } catch (error: any) {
    if (error.code === 11000) {
      return ResponseUtils.conflict(res, 'Duplicate record');
    }
    next(error);
  }
});

/**
 * PUT /api/v2/edits/:editId
 * User updates their own pending edit (only while still pending).
 */
router.put('/:editId', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body.title) {
      return ResponseUtils.badRequest(res, 'title is required');
    }

    const existing = await Edit.findOne({ editId: parseInt(req.params.editId) });
    if (!existing) return ResponseUtils.notFound(res, 'Edit not found');

    if (existing.status !== 'pending') {
      return ResponseUtils.badRequest(res, 'Only pending edits can be updated');
    }

    const updated = await Edit.findOneAndUpdate(
      { editId: parseInt(req.params.editId) },
      { ...req.body, status: 'pending', updated: new Date() },
      { new: true, runValidators: true }
    );

    ResponseUtils.success(res, updated);
  } catch (error: any) {
    if (error.code === 11000) {
      return ResponseUtils.conflict(res, 'Duplicate record');
    }
    next(error);
  }
});

/**
 * PATCH /api/v2/edits/:editId/approve
 * Admin approves an edit. Requires x-api-key header.
 */
router.patch('/:editId/approve', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const edit = await Edit.findOneAndUpdate(
      { editId: parseInt(req.params.editId) },
      { status: 'accepted', updated: new Date() },
      { new: true }
    );

    if (!edit) return ResponseUtils.notFound(res, 'Edit not found');

    ResponseUtils.success(res, { message: 'Edit approved', edit });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v2/edits/:editId/reject
 * Admin rejects an edit. Accepts optional { reason: string } body.
 * Requires x-api-key header.
 */
router.patch('/:editId/reject', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatePayload: Record<string, any> = {
      status: 'rejected',
      updated: new Date(),
    };
    if (req.body?.reason) {
      updatePayload.rejectReason = req.body.reason;
    }

    const edit = await Edit.findOneAndUpdate(
      { editId: parseInt(req.params.editId) },
      updatePayload,
      { new: true }
    );

    if (!edit) return ResponseUtils.notFound(res, 'Edit not found');

    ResponseUtils.success(res, { message: 'Edit rejected', edit });
  } catch (error) {
    next(error);
  }
});

/** DELETE /api/v2/edits/:editId */
router.delete('/:editId', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await Edit.deleteOne({ editId: parseInt(req.params.editId) });
    if (result.deletedCount === 0) {
      return ResponseUtils.notFound(res, 'Edit not found');
    }
    ResponseUtils.success(res, { message: 'Edit deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
