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
import axios, { AxiosError } from "axios";

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

export const registerUser = async (
  req: TypedRequestBody<RegisterRequestBody>,
  res: Response,
  next: NextFunction
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
      throw new AuthError("Email and password are required");
    }

    const existingUser = await User.findOne({ email }).exec();
    if (existingUser) {
      throw new AuthError("User already exists");
    }

    // Enforce password strength
    if (password.length < 8) {
      throw new AuthError("Password must be at least 8 characters long");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      password: hashedPassword,
      authMethod: "email",
      createdAt: new Date(),
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
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
      throw new AuthError('Authentication failed');
    }

    const user = req.user as any;

    const [accessToken, refreshToken] = await Promise.all([
      generateAccessToken(user._id),
      generateRefreshToken(user._id),
    ]);

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, getCookieConfig());

    // Redirect with access token
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${accessToken}`);
  } catch (error) {
    handleAuthError(error, res);
  }
  
};

export const loginUser: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthError("Authentication failed", 401);
    }

    const userId = (req.user as any)._id;
    const [accessToken, refreshToken] = await Promise.all([
      generateAccessToken(userId),
      generateRefreshToken(userId),
    ]);

    // Update last login timestamp
    await User.findByIdAndUpdate(userId, { lastLogin: new Date() });

    res.cookie("refreshToken", refreshToken, getCookieConfig());
    res.json({ accessToken });
  } catch (error) {
    handleAuthError(error, res);
  }
};

export const refreshToken: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new AuthError("Refresh token missing", 401);
    }

    const decoded = await verifyToken(refreshToken, JWT_REFRESH_SECRET);
    const accessToken = await generateAccessToken(decoded.userId);

    res.json({ accessToken });
  } catch (error) {
    handleAuthError(error, res);
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
