import mongoose, { Schema, Document } from 'mongoose';

export type ReportType = 'typo' | 'missing_verse' | 'wrong_song' | 'wrong_number' | 'other';

export interface ISongReport extends Document {
  reportId: number;
  songId: number;
  bookId: number;
  songNo: number;
  songTitle: string;
  reportType: ReportType;
  description: string;
  reportedBy?: string;  // optional device/user identifier
  resolved: boolean;
  createdAt: Date;
}

const songReportSchema = new Schema<ISongReport>({
  reportId: {
    type: Number,
    unique: true,
    index: true,
  },
  songId: {
    type: Number,
    required: [true, 'songId is required'],
    index: true,
  },
  bookId: {
    type: Number,
    required: [true, 'bookId is required'],
  },
  songNo: {
    type: Number,
    required: [true, 'songNo is required'],
  },
  songTitle: {
    type: String,
    required: [true, 'songTitle is required'],
    trim: true,
  },
  reportType: {
    type: String,
    enum: ['typo', 'missing_verse', 'wrong_song', 'wrong_number', 'other'],
    required: [true, 'reportType is required'],
  },
  description: {
    type: String,
    required: [true, 'description is required'],
    trim: true,
    maxlength: [1000, 'description cannot exceed 1000 characters'],
  },
  reportedBy: {
    type: String,
    trim: true,
  },
  resolved: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const SongReport =
  mongoose.models['SongReport'] ||
  mongoose.model<ISongReport>('SongReport', songReportSchema);

export default SongReport;
