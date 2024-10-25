import {
  ACCESS_TOKEN_EXPIRY,
  JWT_REFRESH_SECRET,
  JWT_SECRET,
  REFRESH_TOKEN_EXPIRY,
} from "@utils/constants";
import jwt from "jsonwebtoken";

// Helper function to generate access and refresh tokens
export const generateAccessToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
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
