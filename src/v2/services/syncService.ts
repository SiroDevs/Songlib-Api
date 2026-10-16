import { Song } from '../models';

export interface BookSyncMeta {
  bookId: number;
  songCount: number;
  lastUpdated: string | null;
}

export class SyncService {
  /**
   * Tiny "what changed?" summary used by the app to decide whether a book
   * needs to be downloaded at all.
   *
   * Per book: how many songs it has and when any of them last changed.
   * Songs created before `updated` was populated fall back to `created`.
   *
   * `songCount` also catches deletions, which a `since` query cannot see.
   * `serverTime` is captured BEFORE the query so the app can safely use it as
   * its next `since` cursor without missing writes that land mid-request.
   */
  static async getBookMeta(bookIds: number[]) {
    const serverTime = new Date().toISOString();

    const rows = await Song.aggregate([
      { $match: { book: { $in: bookIds } } },
      {
        $group: {
          _id: '$book',
          songCount: { $sum: 1 },
          lastUpdated: { $max: { $ifNull: ['$updated', '$created'] } },
        },
      },
    ]);

    const byBook = new Map<number, any>(rows.map((r) => [r._id as number, r]));

    // Always return an entry per requested book, even if it has no songs.
    const books: BookSyncMeta[] = bookIds.map((bookId) => {
      const r = byBook.get(bookId);
      return {
        bookId,
        songCount: r ? r.songCount : 0,
        lastUpdated: r?.lastUpdated ? new Date(r.lastUpdated).toISOString() : null,
      };
    });

    return { serverTime, books };
  }
}
