import { Router, Request, Response, NextFunction } from 'express';
import { Organisation, Acounter } from '../models';
import { ResponseUtils } from '../utils/responseUtils';
import { requireApiKey } from '../middleware/auth';
import { readLimiter, writeLimiter } from '../middleware/rateLimit';

const router = Router();

router.use(requireApiKey);

/** GET /api/v2/organisations */
router.get('/', readLimiter, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const orgs = await Organisation.find({}).select('-_id');
    ResponseUtils.success(res, orgs);
  } catch (error) {
    next(error);
  }
});

/** GET /api/v2/organisations/:orgId */
router.get('/:orgId', readLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = await Organisation.findOne({ orgId: parseInt(req.params.orgId as string) }).select('-_id');
    if (!org) {
      return ResponseUtils.notFound(res, 'Organisation not found');
    }
    ResponseUtils.success(res, org);
  } catch (error) {
    next(error);
  }
});

/** POST /api/v2/organisations */
router.post('/', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body.title) {
      return ResponseUtils.badRequest(res, 'title is required');
    }

    const counter = await Acounter.findOneAndUpdate(
      { _id: 'orgs' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    req.body.orgId = counter!.seq;
    const org = await Organisation.create(req.body);
    ResponseUtils.created(res, org);
  } catch (error: any) {
    if (error.code === 11000) {
      return ResponseUtils.conflict(res, 'Duplicate record');
    }
    next(error);
  }
});

/**
 * PUT /api/v2/organisations/:orgId
 * v1 bug fixed: v1 used POST /:orgid for updates.
 */
router.put('/:orgId', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body.title) {
      return ResponseUtils.badRequest(res, 'title is required');
    }

    const updated = await Organisation.findOneAndUpdate(
      { orgId: parseInt(req.params.orgId as string) },
      { ...req.body, updated: new Date() },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return ResponseUtils.notFound(res, 'Organisation not found');
    }

    ResponseUtils.success(res, updated);
  } catch (error: any) {
    if (error.code === 11000) {
      return ResponseUtils.conflict(res, 'Duplicate record');
    }
    next(error);
  }
});

/** DELETE /api/v2/organisations/:orgId */
router.delete('/:orgId', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await Organisation.deleteOne({ orgId: parseInt(req.params.orgId as string) });
    if (result.deletedCount === 0) {
      return ResponseUtils.notFound(res, 'Organisation not found');
    }
    ResponseUtils.success(res, { message: 'Organisation deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
