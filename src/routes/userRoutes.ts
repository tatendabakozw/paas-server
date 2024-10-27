import { Router } from "express";
import { deleteUserAccount, getUserDetails, updateUserDetails, updateUserPassword } from "@controllers/userController";
import { authenticateToken } from "@middlewares/auth";

const router = Router();

/**
 * @swagger
 * /user/details:
 *   post:
 *     summary: Update user details
 *     tags: [User]
 *     description: Updates additional details for the user, such as profession and location. Requires an access token for authorization.
 *     security:
 *       - bearerAuth: []  # Indicates that an Authorization header with Bearer token is required
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profession:
 *                 type: string
 *                 description: The user's profession (e.g., Engineer, Designer)
 *                 example: "Engineer"
 *               location:
 *                 type: string
 *                 description: The user's location or city
 *                 example: "New York"
 *     responses:
 *       200:
 *         description: User details updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User details updated successfully"
 *                 user:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     profession:
 *                       type: string
 *                       example: "Engineer"
 *                     location:
 *                       type: string
 *                       example: "New York"
 *       401:
 *         description: Unauthorized. Access token missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Access token missing"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to update user details"
 */
router.post("/details", authenticateToken, updateUserDetails);

/**
 * @swagger
 * /user/details:
 *   get:
 *     summary: Get current user details
 *     tags: [User]
 *     description: Retrieves details of the logged-in user. Requires an access token for authorization.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     profession:
 *                       type: string
 *                       example: "Engineer"
 *                     location:
 *                       type: string
 *                       example: "New York"
 *       401:
 *         description: Unauthorized. Access token missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Access token missing"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch user details"
 */
router.get("/details", authenticateToken, getUserDetails);

/**
 * @swagger
 * /user/password:
 *   put:
 *     summary: Update user password
 *     tags: [User]
 *     description: Allows the user to change their password. Requires the current password and a new password. Authorization is required.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: The user's current password
 *                 example: "oldPassword123"
 *               newPassword:
 *                 type: string
 *                 description: The new password for the user
 *                 example: "newPassword456"
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password updated successfully"
 *       400:
 *         description: Current password is incorrect
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Current password is incorrect"
 *       401:
 *         description: Unauthorized. Access token missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Access token missing"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to update password"
 */
router.put("/password", authenticateToken, updateUserPassword);

/**
 * @swagger
 * /user:
 *   delete:
 *     summary: Delete user account
 *     tags: [User]
 *     description: Deletes the current user's account. Requires an access token for authorization.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User account deleted successfully"
 *       401:
 *         description: Unauthorized. Access token missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Access token missing"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to delete user account"
 */
router.delete("/", authenticateToken, deleteUserAccount);

export default router;
