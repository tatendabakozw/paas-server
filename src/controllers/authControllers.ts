import { NextFunction, Request, RequestHandler, Response } from "express";
import bcrypt from "bcryptjs";
import User from "@models/userModel";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from "@helpers/tokenHelpers";
import { TypedRequestBody } from "src/types/general";
import { RegisterRequestBody } from "src/types/auth";
import {
  FRONTEND_URL,
  GITHUB_CALLBACK_URL,
  GITHUB_CLIENT_ID,
  JWT_REFRESH_SECRET,
} from "@utils/constants";
import { AxiosError } from "axios";
import passport from "passport";
import jwt from "jsonwebtoken";
import logger from "@utils/logger";
import { TokenExpiredError } from 'jsonwebtoken';

// Custom error class for authentication errors
class AuthError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = "AuthError";
  }
}

// Utility function to handle authentication errors
const handleAuthError = (error: unknown, res: Response) => {
  if (error instanceof AuthError) {
    return res.status(error.statusCode).json({ error: error.message });
  }
  if (error instanceof AxiosError) {
    return res
      .status(500)
      .json({ error: "External service error", details: error.message });
  }
  console.error("Authentication error:", error);
  return res.status(500).json({ error: "Internal server error" });
};

// Cookie configuration based on environment
const getCookieConfig = (maxAge: number = 7 * 24 * 60 * 60 * 1000) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge,
});

// Add these constants for token expiration times
const ACCESS_TOKEN_EXPIRY = '15m';  // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';  // 7 days

export const registerUser = async (
  req: TypedRequestBody<RegisterRequestBody>,
  res: Response,
): Promise<void> => {
  try {
    const { email, password, authMethod } = req.body;

    if (authMethod === "github") {
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${GITHUB_CALLBACK_URL}&scope=user,repo`;
      res.json({ redirectUrl: githubAuthUrl });
      return;
    }

    // Validate email and password
    if (!email || !password) {
      res.status(400).json({message: "Email and password are required", success: false})
      return
    }

    const existingUser = await User.findOne({ email }).exec();
    if (existingUser) {
      res.status(400).json({message: "User already exists", success: false})
      return
    }

    // Enforce password strength
    if (password.length < 8) {
      res.status(400).json({message: "Password must be at least 8 characters long", success: false})
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      password: hashedPassword,
      authMethod: "email",
      createdAt: new Date(),
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully", success: true });
  } catch (error) {
    handleAuthError(error, res);
  }
};

export const githubCallback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthError("Authentication failed");
    }

    const user = req.user as any;
    // Extract email from user object
    const userEmail = user.email;
    
    // You might want to log or use the email
    console.log('User email:', userEmail);

    const [accessToken, refreshToken] = await Promise.all([
      generateAccessToken(user._id, user.email, ACCESS_TOKEN_EXPIRY),
      generateRefreshToken(user._id, REFRESH_TOKEN_EXPIRY)
    ]);

    // Set refresh token cookie
    res.cookie("refreshToken", refreshToken, getCookieConfig());

    // You can include email in the redirect if needed
    res.redirect(
      `${FRONTEND_URL}/auth/callback?token=${accessToken}&email=${encodeURIComponent(userEmail)}`
    );
  } catch (error) {
    handleAuthError(error, res);
  }
};

export const loginUser: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  passport.authenticate("local", (err: any, user: any, info: any) => {
    if (err) {
      logger.error('Authentication error:', err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (!user) {
      return res
        .status(401)
        .json({ message: info?.message || "Authentication failed" });
    }

    req.logIn(user, async (loginErr) => {
      if (loginErr) {
        logger.error('Login error:', loginErr);
        return res.status(500).json({ message: "Login failed" });
      }

      try {
        // Generate tokens with consistent user data
        const [accessToken, refreshToken] = await Promise.all([
          generateAccessToken(user._id.toString(), user.email, ACCESS_TOKEN_EXPIRY),
          generateRefreshToken(user._id.toString(), ACCESS_TOKEN_EXPIRY )
        ]);

        // Update last login timestamp
        await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

        // Set refresh token as a cookie
        res.cookie("refreshToken", refreshToken, getCookieConfig());
        res.status(200).json({ 
          accessToken,
          user: {
            userId: user._id,
            email: user.email
          }
        });
      } catch (tokenErr:any) {
        logger.error('Token generation error:', tokenErr);
        return res.status(500).json({ 
          message: "Token generation failed",
          details: process.env.NODE_ENV === 'development' ? tokenErr.message : undefined
        });
      }
    });
  })(req, res, next);
};

export const refreshToken: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ 
        error: 'refresh_token_required',
        message: "Refresh token not found" 
      });
      return;
    }

    const decoded = await verifyToken(refreshToken, JWT_REFRESH_SECRET) as {
      userId: string;
    };

    const user = await User.findById(decoded.userId);
    if (!user) {
      res.clearCookie("refreshToken", getCookieConfig());
      res.status(401).json({ 
        error: 'invalid_token',
        message: "User not found" 
      });
      return;
    }

    // Generate both new tokens with explicit expiry times
    const [accessToken, newRefreshToken] = await Promise.all([
      generateAccessToken(user._id, user.email, ACCESS_TOKEN_EXPIRY),
      generateRefreshToken(user._id, REFRESH_TOKEN_EXPIRY)
    ]);

    // Set new refresh token cookie
    res.cookie("refreshToken", newRefreshToken, getCookieConfig());

    // Send new access token with expiry information
    res.json({ 
      accessToken,
      expiresIn: ACCESS_TOKEN_EXPIRY,
      tokenType: 'Bearer'
    });
  } catch (error) {
    logger.error("Error in refreshToken:", error);
    
    // Clear the refresh token cookie on any error
    res.clearCookie("refreshToken", getCookieConfig());
    
    if (error instanceof TokenExpiredError) {
      res.status(401).json({ 
        error: 'token_expired',
        message: "Refresh token has expired" 
      });
      return;
    }
    
    res.status(401).json({ 
      error: 'invalid_token',
      message: "Invalid refresh token" 
    });
  }
};

export const logoutUser: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    res.clearCookie("refreshToken", getCookieConfig());

    if (req.logout) {
      await new Promise<void>((resolve, reject) => {
        req.logout((err) => {
          if (err) reject(err);
          resolve();
        });
      });
    }

    // Optional: Invalidate refresh token in database
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      // Add logic to invalidate the refresh token
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    handleAuthError(error, res);
  }
};
