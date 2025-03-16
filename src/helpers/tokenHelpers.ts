import {
  ACCESS_TOKEN_EXPIRY,
  JWT_REFRESH_SECRET,
  JWT_SECRET,
  REFRESH_TOKEN_EXPIRY,
} from "@utils/constants";
import jwt from "jsonwebtoken";

// Helper function to generate access and refresh tokens
export const generateAccessToken = (
  userId: string, 
  email: string,
  expiresIn: string = ACCESS_TOKEN_EXPIRY
) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  
  return jwt.sign(
    { userId, email },
    secret,
    { expiresIn }
  );
};

export const generateRefreshToken = (
  userId: string,
  expiresIn: string = REFRESH_TOKEN_EXPIRY
) => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not configured');
  }
  
  return jwt.sign(
    { userId },
    secret,
    { expiresIn }
  );
};

export const verifyToken = (token: string, secret: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return reject(err);
      }
      resolve(decoded);
    });
  });
};
