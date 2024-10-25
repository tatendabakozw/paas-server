import { NextFunction, Response } from "express";
import { TypedRequestBody } from "src/types/general";

export const updateUserDetails =  (req: TypedRequestBody<any>, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ message: "success" });
      return;
    } catch (error) {
      next(error);
    }
  }