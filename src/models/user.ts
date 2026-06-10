import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    userId: number;
    fullname: string;
    username: string;
    email: string;
    phone: string;
    bio: string;
    role: 'user' | 'admin';
    lastseen: Date;
    created: Date;
    updated?: Date;
}

const userSchema = new Schema<IUser>({
    userId: {
        type: Number,
        unique: true,
        index: true
    },
    fullname: {
        type: String,
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    username: {
        type: String,
        unique: true,
        trim: true,
        maxlength: [100, 'Username cannot exceed 50 characters']
    },
    email: {
        type: String,
        unique: true,
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    phone: {
        type: String,
        unique: true,
        trim: true,
    },
    bio: {
        type: String,
        trim: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
        index: true
    },
    lastseen: {
        type: Date,
        default: Date.now
    },
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date
    }
});

export const User = mongoose.model<IUser>('User', userSchema);
export default User;
