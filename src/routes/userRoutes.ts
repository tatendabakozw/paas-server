import { Router } from "express";
import { updateUserDetails } from "@controllers/userController";
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

export default router;
