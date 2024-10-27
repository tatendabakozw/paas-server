import { Document } from "mongoose";

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  profession?: string; // Optional profession field
  location?: string; // Optional location field
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionUser extends Document {
  userId: string;
  iat: Date;
  exp: Date;
}

