import { Document } from "mongoose";

declare global {
  namespace Express {
    // Extend the Request interface
    interface Request {
      user?: {
        userId: string;
        _id?: string;
        email?: string;
      }
    }
  }
}

export {};

export {};