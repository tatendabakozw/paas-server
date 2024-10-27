import { Request } from "express";

export interface TypedRequestBody<T> extends Request {
  body: T;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}