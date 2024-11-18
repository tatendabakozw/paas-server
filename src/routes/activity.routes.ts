import { RequestHandler, Router } from "express";
import { authenticateToken } from "@middlewares/auth";
import { getProjectActivities, getUserActivities } from "@controllers/activityController";

const router = Router();

/**
 * @swagger
 * /activity/project/{projectId}:
 *   get:
 *     summary: Get activities for a specific project
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of project activities
 *       401:
 *         description: Unauthorized
 */
router.get("/project/:projectId", authenticateToken, getProjectActivities as RequestHandler);

/**
 * @swagger
 * /activity/user:
 *   get:
 *     summary: Get all activities for the current user
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user activities
 *       401:
 *         description: Unauthorized
 */
router.get("/user", authenticateToken, getUserActivities as RequestHandler);

export default router;