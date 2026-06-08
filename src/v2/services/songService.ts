import { Song, UserLike, SongReport } from '../models';
import { CounterService } from './counterService';

export interface SongQuery {
  page?: number;
  limit?: number;
  since?: string; // ISO date string — fetch only songs updated after this timestamp
}

export class SongService {
  static async getSongById(songId: number) {
    return await Song.findOne({ songId }).select('-_id');
  }

  /**
   * Get songs by book IDs with optional pagination and delta sync.
   *
   * ?since=<ISO date>  — returns only songs updated after that timestamp (delta sync)
   * ?page=1&limit=200  — standard pagination
   *
   * The Android app does a full sync on first install then uses ?since for
   * background WorkManager syncs, keeping payloads small.
   */
  static async getSongsByBookIds(bookIds: string[], query: SongQuery = {}) {
    const { page = 1, limit = 500, since } = query;
    const skip = (page - 1) * limit;

    const filter: any = { book: { $in: bookIds } };
    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        filter.updated = { $gt: sinceDate };
      }
    }

    const [songs, total] = await Promise.all([
      Song.find(filter).select('-_id').sort('songId').skip(skip).limit(limit),
      Song.countDocuments(filter),
    ]);

    return {
      songs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  /**
   * Create a single song.
   *
   * v1 bug: Song had `unique: true` on title globally, so "Amazing Grace"
   * in Book A would block "Amazing Grace" in Book B.
   *
   * Fix: enforce uniqueness on (book, songNo) pair in the service layer.
   * A DB migration to drop the old title index and add a compound index
   * on { book: 1, songNo: 1 } is documented in MIGRATION.md.
   */
  static async createSingleSong(songData: any) {
    // Enforce uniqueness on (book, songNo) — not global title
    const existing = await Song.findOne({
      book: songData.book,
      songNo: songData.songNo,
    });
    if (existing) {
      throw Object.assign(
        new Error(`Song #${songData.songNo} already exists in book ${songData.book}`),
        { code: 'DUPLICATE_SONG' }
      );
    }

    const nextId = await CounterService.getNextId('songs');
    songData.songId = nextId;
    return await Song.create(songData);
  }

  static async createMultipleSongs(songsData: any[]) {
    const createdSongs: any[] = [];
    const errors: any[] = [];

    for (const [index, item] of songsData.entries()) {
      try {
        if (!item.songNo || !item.title || !item.book) {
          errors.push({ index, error: 'book, songNo and title are required' });
          continue;
        }
        const song = await this.createSingleSong(item);
        createdSongs.push(song);
      } catch (error: any) {
        errors.push({
          index,
          error:
            error.code === 'DUPLICATE_SONG' || error.code === 11000
              ? 'Duplicate record'
              : 'Creation failed',
          details: error.message,
        });
      }
    }

    return { createdSongs, errors };
  }

  static async updateSong(songId: number, updateData: any) {
    const { songId: _, ...safeData } = updateData;
    safeData.updated = new Date();

    return await Song.findOneAndUpdate({ songId }, safeData, {
      new: true,
      runValidators: true,
    });
  }

  static async updateMultipleSongs(songsData: any[]) {
    const updateResults: any[] = [];
    const errors: any[] = [];

    for (const [index, item] of songsData.entries()) {
      try {
        if (!item.songId) {
          errors.push({ index, error: 'songId is required for update' });
          continue;
        }
        if (!item.title) {
          errors.push({ index, error: 'title is required' });
          continue;
        }
        const song = await this.updateSong(item.songId, item);
        if (!song) {
          errors.push({ index, songId: item.songId, error: 'Song not found' });
          continue;
        }
        updateResults.push(song);
      } catch (error: any) {
        errors.push({
          index,
          songId: item.songId,
          error: error.code === 11000 ? 'Duplicate record' : 'Update failed',
          details: error.message,
        });
      }
    }

    return { updateResults, errors };
  }

  static async deleteSong(songId: number) {
    return await Song.deleteOne({ songId });
  }

  // ── Per-user likes ─────────────────────────────────────────────────────────

  /**
   * Toggle a like for a specific user on a specific song.
   * Returns the new like state and the updated aggregate like count.
   */
  static async toggleLike(userId: number, songId: number) {
    const existing = await UserLike.findOne({ userId, songId });

    if (existing) {
      await UserLike.deleteOne({ userId, songId });
      await Song.findOneAndUpdate({ songId }, { $inc: { likes: -1 } });
      return { liked: false };
    } else {
      await UserLike.create({ userId, songId });
      await Song.findOneAndUpdate({ songId }, { $inc: { likes: 1 } });
      return { liked: true };
    }
  }

  static async getLikedSongIds(userId: number): Promise<number[]> {
    const likes = await UserLike.find({ userId }).select('songId -_id');
    return likes.map((l) => l.songId);
  }

  static async isLiked(userId: number, songId: number): Promise<boolean> {
    const like = await UserLike.findOne({ userId, songId });
    return !!like;
  }

  // ── Song reports ───────────────────────────────────────────────────────────

  static async createReport(reportData: any) {
    const nextId = await CounterService.getNextId('reports');
    reportData.reportId = nextId;
    return await SongReport.create(reportData);
  }

  static async getReports(resolved?: boolean) {
    const filter = resolved !== undefined ? { resolved } : {};
    return await SongReport.find(filter).sort({ createdAt: -1 });
  }

  static async resolveReport(reportId: number) {
    return await SongReport.findOneAndUpdate(
      { reportId },
      { resolved: true },
      { new: true }
    );
  }
}
