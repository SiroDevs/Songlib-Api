import { Router, Request, Response, NextFunction } from 'express';
import { Draft, Acounter } from '../models';
import { ResponseUtils } from '../utils/responseUtils';
import { requireApiKey } from '../middleware/auth';
import { readLimiter, writeLimiter } from '../middleware/rateLimit';

const router = Router();

router.use(requireApiKey);

/** GET /api/v2/drafts */
router.get('/', readLimiter, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const drafts = await Draft.find({}).select('-_id').sort({ created: -1 });
    ResponseUtils.success(res, drafts);
  } catch (error) {
    next(error);
  }
});

/** GET /api/v2/drafts/:draftId */
router.get('/:draftId', readLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const draft = await Draft.findOne({ draftId: parseInt(req.params.draftId) }).select('-_id');
    if (!draft) {
      return ResponseUtils.notFound(res, 'Draft not found');
    }
    ResponseUtils.success(res, draft);
  } catch (error) {
    next(error);
  }
});

/** POST /api/v2/drafts */
router.post('/', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body.title) {
      return ResponseUtils.badRequest(res, 'title is required');
    }

    const counter = await Acounter.findOneAndUpdate(
      { _id: 'drafts' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    req.body.draftId = counter!.seq;
    const draft = await Draft.create(req.body);
    ResponseUtils.created(res, draft);
  } catch (error: any) {
    if (error.code === 11000) {
      return ResponseUtils.conflict(res, 'Duplicate record');
    }
    next(error);
  }
});

/**
 * PUT /api/v2/drafts/:draftId
 * v1 bug fixed: v1 used POST /:draftid for updates — wrong HTTP method.
 */
router.put('/:draftId', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body.title) {
      return ResponseUtils.badRequest(res, 'title is required');
    }

    const updated = await Draft.findOneAndUpdate(
      { draftId: parseInt(req.params.draftId) },
      { ...req.body, updated: new Date() },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return ResponseUtils.notFound(res, 'Draft not found');
    }

    ResponseUtils.success(res, updated);
  } catch (error: any) {
    if (error.code === 11000) {
      return ResponseUtils.conflict(res, 'Duplicate record');
    }
    next(error);
  }
});

/** DELETE /api/v2/drafts/:draftId */
router.delete('/:draftId', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await Draft.deleteOne({ draftId: parseInt(req.params.draftId) });
    if (result.deletedCount === 0) {
      return ResponseUtils.notFound(res, 'Draft not found');
    }
    ResponseUtils.success(res, { message: 'Draft deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
