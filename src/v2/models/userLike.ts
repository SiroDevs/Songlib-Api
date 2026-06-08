import mongoose, { Schema, Document } from 'mongoose';

/**
 * Tracks which user liked which song.
 * Replaces the global `liked: boolean` on the Song model
 * which incorrectly treated likes as a global state.
 */
export interface IUserLike extends Document {
  userId: number;
  songId: number;
  createdAt: Date;
}

const userLikeSchema = new Schema<IUserLike>(
  {
    userId: {
      type: Number,
      required: [true, 'userId is required'],
      index: true,
    },
    songId: {
      type: Number,
      required: [true, 'songId is required'],
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

// A user can only like a given song once
userLikeSchema.index({ userId: 1, songId: 1 }, { unique: true });

export const UserLike =
  mongoose.models['UserLike'] ||
  mongoose.model<IUserLike>('UserLike', userLikeSchema);

export default UserLike;
