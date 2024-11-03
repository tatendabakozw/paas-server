import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from 'src/types/user';

// TODO - add github accessToken
const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  username:{
    type: String,
    default: null
  },
  password: {
    type: String,
  },
  profession: {
    type: String,
    default: null, // Set to null if it's optional
  },
  location: {
    type: String,
    default: null, // Set to null if it's optional
  },
  authMethod: {
    type: String,
    enum: ['email', 'github'], // Specify the allowed authentication methods
    required: true, // Make it required
    default: 'email', // Set default authentication method to email
  },
  githubId: {
    type: String,
    default: null, // Optional field for GitHub ID
  },
  githubAccessToken: {
    type: String,
    default: null, // Optional field for GitHub access token
  },
  lastLogin:{
    type: Date
  }
},{
    timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema);
