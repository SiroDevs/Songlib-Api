export class ValidationUtils {
  static parseIds(ids: string): number[] {
    return ids
      .split(',')
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id) && id > 0);
  }

  static parseBookIds(ids: string): string[] {
    return ids
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
  }

  static isValidId(id: any): boolean {
    const parsed = parseInt(id);
    return !isNaN(parsed) && parsed > 0;
  }

  static isBulkOperation(data: any): data is any[] {
    return Array.isArray(data);
  }

  static parsePagination(query: any): { page: number; limit: number } {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(query.limit) || 500));
    return { page, limit };
  }

  static validateBookData(data: any): string | null {
    if (!data.title) return 'title is required';
    if (!data.subTitle) return 'subTitle is required';
    return null;
  }

  static validateSongData(data: any): string | null {
    if (!data.book) return 'book is required';
    if (!data.songNo) return 'songNo is required';
    if (!data.title) return 'title is required';
    return null;
  }

  static validateReportData(data: any): string | null {
    if (!data.songId) return 'songId is required';
    if (!data.bookId) return 'bookId is required';
    if (!data.songNo) return 'songNo is required';
    if (!data.songTitle) return 'songTitle is required';
    if (!data.reportType) return 'reportType is required';
    if (!data.description) return 'description is required';

    const validTypes = ['typo', 'missing_verse', 'wrong_song', 'wrong_number', 'other'];
    if (!validTypes.includes(data.reportType)) {
      return `reportType must be one of: ${validTypes.join(', ')}`;
    }

    return null;
  }
}
