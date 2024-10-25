import { IUser } from '@models/userModel';
import { Express } from 'express-serve-static-core';

declare global {
  namespace Express {
    // Extend the Request interface
    interface Request {
      user?: IUser
    }

    // Extend the User interface
    interface User  extends IUser{}
  }
}

// This export makes TypeScript treat this file as a module
export {};