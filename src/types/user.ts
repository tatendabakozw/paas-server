import { Document } from "mongoose";

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  profession?: string; // Optional profession field
  location?: string; // Optional location field
  createdAt: Date;
  updatedAt: Date;
  username?: string
  githubAccessToken?:string
  githubId?:string
}

export interface SessionUser {
  userId: string;
  iat?: number;
  exp?: number;
  _id: string;
  email?: string;
}