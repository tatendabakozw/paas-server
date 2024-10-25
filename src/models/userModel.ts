import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from 'src/types/user';

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  profession: {
    type: String,
    default: null, // Set to null if it's optional
  },
  location: {
    type: String,
    default: null, // Set to null if it's optional
  },
 
},{
    timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema);
