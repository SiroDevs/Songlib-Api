import mongoose, { Schema, Document } from 'mongoose';

export interface ISong extends Document {
    songId: number;
    book: number;
    songNo: number;
    title: string;
    alias: string;
    content: string;
    key: string;
    author: string;
    views: number;
    likes: number;
    liked: boolean;
    created: Date;
    updated?: Date;
}

const songSchema = new Schema<ISong>({
    songId: {
        type: Number,
        unique: true,
        index: true
    },
    book: {
        type: Number,
        default: 0,
        required: [true, 'Book is required'],
    },
    songNo: {
        type: Number,
        default: 0,
        required: [true, 'SongNo is required'],
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        unique: true,
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    alias: {
        type: String,
        maxlength: [100, 'Alias cannot exceed 100 characters']
    },
    content: {
        type: String,
        trim: true,
    },
    key: {
        type: String,
        trim: true,
    },
    author: {
        type: String,
        trim: true,
    },
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    liked: {
        type: Boolean,
        default: false
    },
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    }
});

// Delta sync (`?since=`) and sync-meta both filter / aggregate by book + updated.
songSchema.index({ book: 1, updated: 1 });

export const Song = mongoose.model<ISong>('Song', songSchema);
export default Song;