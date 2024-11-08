import { verifyToken } from "@helpers/tokenHelpers";
import { JWT_SECRET } from "@utils/constants";
import { Request, Response, NextFunction } from "express";
import logger from '@utils/logger';

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
};


export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token missing" });
    return;
  }

  try {
    const decoded = await verifyToken(token, JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };
    next();
  } catch (err) {
    logger.error('Token verification failed:', err);
    res.status(403).json({ error: "Invalid or expired access token" });
  }
};