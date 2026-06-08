import { Book } from '../models';
import { CounterService } from './counterService';

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export class BookService {
  static async getAllBooks() {
    return await Book.find({ enabled: true }).select('-_id').sort('bookNo');
  }

  static async getBooksByIds(bookIds: string[]) {
    return await Book.find({ bookId: { $in: bookIds } }).select('-_id');
  }

  static async createSingleBook(bookData: any) {
    const nextId = await CounterService.getNextId('books');
    bookData.bookId = nextId;
    return await Book.create(bookData);
  }

  static async createMultipleBooks(booksData: any[]) {
    const createdBooks: any[] = [];
    const errors: any[] = [];

    for (const [index, item] of booksData.entries()) {
      try {
        if (!item.title) {
          errors.push({ index, error: 'Title is required' });
          continue;
        }
        const book = await this.createSingleBook(item);
        createdBooks.push(book);
      } catch (error: any) {
        errors.push({
          index,
          error: error.code === 11000 ? 'Duplicate record' : 'Creation failed',
          details: error.message,
        });
      }
    }

    return { createdBooks, errors };
  }

  static async updateBook(bookId: number, updateData: any) {
    // Strip bookId from the update payload to prevent accidental ID changes
    const { bookId: _, ...safeData } = updateData;
    safeData.updated = new Date();

    return await Book.findOneAndUpdate({ bookId }, safeData, {
      new: true,
      runValidators: true,
    });
  }

  static async updateMultipleBooks(booksData: any[]) {
    const updateResults: any[] = [];
    const errors: any[] = [];

    for (const [index, item] of booksData.entries()) {
      try {
        if (!item.bookId || !item.title) {
          errors.push({ index, error: 'bookId and title are required' });
          continue;
        }
        const book = await this.updateBook(item.bookId, item);
        if (!book) {
          errors.push({ index, bookId: item.bookId, error: 'Book not found' });
          continue;
        }
        updateResults.push(book);
      } catch (error: any) {
        errors.push({
          index,
          bookId: item.bookId,
          error: error.code === 11000 ? 'Duplicate record' : 'Update failed',
          details: error.message,
        });
      }
    }

    return { updateResults, errors };
  }

  static async deleteBook(bookId: number) {
    return await Book.deleteOne({ bookId });
  }
}
