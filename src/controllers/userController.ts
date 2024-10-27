import { Request, Response } from "express";
import User from "@models/userModel"; 
import bcrypt from 'bcryptjs'

/**
 * Update user details (profession, location, etc.)
 */
export const updateUserDetails = async (
  req: any,
  res: Response
): Promise<void> => {
  const userId = req.user?.userId; // Get userId from token (set in authenticateToken middleware)
  const { profession, location } = req.body;

  try {
    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Update user details
    if (profession) user.profession = profession;
    if (location) user.location = location;

    await user.save();

    // Return the updated user data
    res.status(200).json({
      message: "User details updated successfully",
      user: {
        email: user.email,
        profession: user.profession,
        location: user.location,
      },
    });
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).json({ error: "Failed to update user details" });
  }
};

/**
 * Get current user details
 */
export const getUserDetails = async (
  req: any,
  res: Response
): Promise<void> => {
  const userId = req.user?.userId; // Extract userId from the token

  try {
    const user = await User.findById(userId).select("-password"); // Exclude password
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ error: "Failed to fetch user details" });
  }
};

/**
 * Delete user account
 */
export const deleteUserAccount = async (
  req: any,
  res: Response
): Promise<void> => {
  const userId = req.user?.userId;

  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({ message: "User account deleted successfully" });
  } catch (error) {
    console.error("Error deleting user account:", error);
    res.status(500).json({ error: "Failed to delete user account" });
  }
};

/**
 * Update user password
 */
export const updateUserPassword = async (req: any, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
       res.status(404).json({ error: "User not found" });
       return
    }

    // Check if the current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
       res.status(400).json({ error: "Current password is incorrect" });
       return
    }

    // Hash the new password and save it
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ error: "Failed to update password" });
  }
};
