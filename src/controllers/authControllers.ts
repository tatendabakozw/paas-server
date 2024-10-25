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
import { JWT_REFRESH_SECRET } from "@utils/constants";

// Register user controller
export const registerUser = async (
  req: TypedRequestBody<RegisterRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Explicitly handle the type of existingUser
    const existingUser = await User.findOne({ email }).exec();

    if (existingUser) {
      res.status(400).json({ error: "User already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
    return;
  } catch (error) {
    next(error);
    return;
  }
};

// Controller function for login
export const loginUser = async (req: Request, res: Response) => {
  try {
    // Generate tokens
    const accessToken = generateAccessToken((req.user as any)._id);
    const refreshToken = generateRefreshToken((req.user as any)._id);

    // Set refresh token in HttpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send access token in response
    res.json({ accessToken });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to log in" });
  }
};

// Controller function to handle refresh token requests
export const refreshToken: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    res.status(401).json({ error: "Unauthorized. Refresh token missing." });
    return;
  }

  try {
    // Verify the refresh token
    const decoded = await verifyToken(refreshToken, JWT_REFRESH_SECRET);
    const userId = decoded.userId;

    // Generate a new access token
    const newAccessToken = generateAccessToken(userId);

    // Return the new access token in response
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired refresh token" });
  }
};


export const logoutUser = (req: Request, res: Response): void => {
    // Clear the refresh token cookie if it exists
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Secure in production
    sameSite: "strict",
  });
    // If using sessions (optional):
    if (req.logout) {
      req.logout((err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to log out" });
        }
      });
    }
  
    // Send a response to instruct the client to remove tokens
    res.status(200).json({ message: "Logout successful. Please clear access tokens on client side." });
  };