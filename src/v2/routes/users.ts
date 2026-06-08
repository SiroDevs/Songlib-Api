import { Router, Request, Response, NextFunction } from 'express';
import { User, Acounter } from '../models';
import { ResponseUtils } from '../utils/responseUtils';
import { requireApiKey } from '../middleware/auth';
import { readLimiter, writeLimiter } from '../middleware/rateLimit';

const router = Router();

router.use(requireApiKey);

/** GET /api/v2/users */
router.get('/', readLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await User.find({}).select('-_id');
    ResponseUtils.success(res, users);
  } catch (error) {
    next(error);
  }
});

/** GET /api/v2/users/:userId */
router.get('/:userId', readLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findOne({ userId: parseInt(req.params.userId as string) }).select('-_id');
    if (!user) {
      return ResponseUtils.notFound(res, 'User not found');
    }
    ResponseUtils.success(res, user);
  } catch (error) {
    next(error);
  }
});

/** POST /api/v2/users */
router.post('/', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body.username) {
      return ResponseUtils.badRequest(res, 'username is required');
    }

    // Atomic counter — fixes v1 race condition
    const counter = await Acounter.findOneAndUpdate(
      { _id: 'users' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    req.body.userId = counter!.seq;
    const user = await User.create(req.body);
    ResponseUtils.created(res, user);
  } catch (error: any) {
    if (error.code === 11000) {
      return ResponseUtils.conflict(res, 'Duplicate record — username, email or phone already exists');
    }
    next(error);
  }
});

/** PUT /api/v2/users/:userId  (was POST in v1 — REST fix) */
router.put('/:userId', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body.username) {
      return ResponseUtils.badRequest(res, 'username is required');
    }

    const updated = await User.findOneAndUpdate(
      { userId: parseInt(req.params.userId as string) },
      { ...req.body, updated: new Date() },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return ResponseUtils.notFound(res, 'User not found');
    }

    ResponseUtils.success(res, updated);
  } catch (error: any) {
    if (error.code === 11000) {
      return ResponseUtils.conflict(res, 'Duplicate record');
    }
    next(error);
  }
});

/** DELETE /api/v2/users/:userId */
router.delete('/:userId', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await User.findOneAndDelete({ userId: parseInt(req.params.userId as string) });
    if (!deleted) {
      return ResponseUtils.notFound(res, 'User not found');
    }
    ResponseUtils.success(res, { message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
