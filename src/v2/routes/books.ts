import { Router, Request, Response, NextFunction } from 'express';
import { BookService } from '../services/bookService';
import { ResponseUtils } from '../utils/responseUtils';
import { ValidationUtils } from '../utils/validationUtils';
import { requireApiKey } from '../middleware/auth';
import { readLimiter, writeLimiter, bulkLimiter } from '../middleware/rateLimit';

const router = Router();

router.use(requireApiKey);

/**
 * GET /api/v2/books
 * Returns all enabled books sorted by position.
 */
router.get('/', readLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const books = await BookService.getAllBooks();
    ResponseUtils.success(res, books);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v2/books/:ids
 * Fetch one or more books by comma-separated IDs.
 * e.g. /api/v2/books/1,2,3
 */
router.get('/:ids', readLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ids = req.params.ids.split(',').map((id) => id.trim());
    if (ids.length === 0) {
      return ResponseUtils.badRequest(res, 'No valid book IDs provided');
    }
    const books = await BookService.getBooksByIds(ids);
    ResponseUtils.success(res, books);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v2/books
 * Create one book (object body) or many (array body).
 */
router.post('/', bulkLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (ValidationUtils.isBulkOperation(req.body)) {
      const { createdBooks, errors } = await BookService.createMultipleBooks(req.body);
      return ResponseUtils.bulkResult(res, 'books', createdBooks, errors, 201);
    }

    const validationError = ValidationUtils.validateBookData(req.body);
    if (validationError) {
      return ResponseUtils.badRequest(res, validationError);
    }

    const book = await BookService.createSingleBook(req.body);
    ResponseUtils.created(res, book);
  } catch (error: any) {
    if (error.code === 11000) {
      return ResponseUtils.conflict(res, 'Duplicate record');
    }
    next(error);
  }
});

/**
 * PUT /api/v2/books
 * Update one book (object body) or many (array body).
 */
router.put('/', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (ValidationUtils.isBulkOperation(req.body)) {
      const { updateResults, errors } = await BookService.updateMultipleBooks(req.body);
      return ResponseUtils.bulkResult(res, 'books', updateResults, errors);
    }

    if (!req.body.bookId || !req.body.title) {
      return ResponseUtils.badRequest(res, 'bookId and title are required');
    }

    const book = await BookService.updateBook(req.body.bookId, req.body);
    if (!book) {
      return ResponseUtils.notFound(res, 'Book not found');
    }

    ResponseUtils.success(res, book);
  } catch (error: any) {
    if (error.code === 11000) {
      return ResponseUtils.conflict(res, 'Duplicate record');
    }
    next(error);
  }
});

/**
 * DELETE /api/v2/books/:bookId
 */
router.delete('/:bookId', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookId = parseInt(req.params.bookId);
    if (!ValidationUtils.isValidId(bookId)) {
      return ResponseUtils.badRequest(res, 'Invalid bookId');
    }

    const result = await BookService.deleteBook(bookId);
    if (result.deletedCount === 0) {
      return ResponseUtils.notFound(res, 'Book not found');
    }

    ResponseUtils.success(res, { message: 'Book deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
