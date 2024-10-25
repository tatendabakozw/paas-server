export const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
export const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "your_refresh_secret";
export const REFRESH_TOKEN_EXPIRY = "7d"; // Refresh token lifespan
export const ACCESS_TOKEN_EXPIRY = "15m"; // Access token lifespan
export const SESSION_SECRET = process.env.SESSION_SECRET || "your-secret-key";
export const PORT = process.env.PORT || 5500;

