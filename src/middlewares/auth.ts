import { verifyToken } from "@helpers/tokenHelpers";
import { JWT_SECRET } from "@utils/constants";
import { Request, Response, NextFunction } from "express";

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
};


// Middleware to authenticate access tokens from HttpOnly cookies
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Retrieve the token from the Authorization header in "Bearer <token>" format
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Extract the token after "Bearer"

  if (!token) {
    res.status(401).json({ error: "Access token missing" });
    return;
  }

  try {
    // Verify the access token using the verifyToken helper
    const decoded = await verifyToken(token, JWT_SECRET);
    req.user = decoded; // Attach user information to the request
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired access token" });
  }
};