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

/** POST /api/v2/edits */
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
 * v1 bug fixed: v1 used POST /:editid for updates.
 */
router.put('/:editId', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body.title) {
      return ResponseUtils.badRequest(res, 'title is required');
    }

    const updated = await Edit.findOneAndUpdate(
      { editId: parseInt(req.params.editId) },
      { ...req.body, updated: new Date() },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return ResponseUtils.notFound(res, 'Edit not found');
    }

    ResponseUtils.success(res, updated);
  } catch (error: any) {
    if (error.code === 11000) {
      return ResponseUtils.conflict(res, 'Duplicate record');
    }
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
