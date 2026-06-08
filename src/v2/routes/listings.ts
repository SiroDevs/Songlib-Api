import { Router, Request, Response, NextFunction } from 'express';
import { Listing, Acounter } from '../models';
import { ResponseUtils } from '../utils/responseUtils';
import { requireApiKey } from '../middleware/auth';
import { readLimiter, writeLimiter } from '../middleware/rateLimit';

const router = Router();

router.use(requireApiKey);

/** GET /api/v2/listings */
router.get('/', readLimiter, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const listings = await Listing.find({}).select('-_id').sort({ created: -1 });
    ResponseUtils.success(res, listings);
  } catch (error) {
    next(error);
  }
});

/** GET /api/v2/listings/:listingId */
router.get('/:listingId', readLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listing = await Listing.findOne({ listingId: parseInt(req.params.listingId) }).select('-_id');
    if (!listing) {
      return ResponseUtils.notFound(res, 'Listing not found');
    }
    ResponseUtils.success(res, listing);
  } catch (error) {
    next(error);
  }
});

/** POST /api/v2/listings */
router.post('/', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body.title) {
      return ResponseUtils.badRequest(res, 'title is required');
    }

    const counter = await Acounter.findOneAndUpdate(
      { _id: 'listings' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    req.body.listingId = counter!.seq;
    const listing = await Listing.create(req.body);
    ResponseUtils.created(res, listing);
  } catch (error: any) {
    if (error.code === 11000) {
      return ResponseUtils.conflict(res, 'Duplicate record');
    }
    next(error);
  }
});

/** PUT /api/v2/listings/:listingId */
router.put('/:listingId', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await Listing.findOneAndUpdate(
      { listingId: parseInt(req.params.listingId) },
      { ...req.body, updated: new Date() },
      { new: true }
    );

    if (!updated) {
      return ResponseUtils.notFound(res, 'Listing not found');
    }

    ResponseUtils.success(res, updated);
  } catch (error) {
    next(error);
  }
});

/** DELETE /api/v2/listings/:listingId */
router.delete('/:listingId', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await Listing.deleteOne({ listingId: parseInt(req.params.listingId) });
    if (result.deletedCount === 0) {
      return ResponseUtils.notFound(res, 'Listing not found');
    }
    ResponseUtils.success(res, { message: 'Listing deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
