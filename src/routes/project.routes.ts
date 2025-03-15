import { RequestHandler, Router } from "express";
import { authenticateToken } from "@middlewares/auth";
import {
  createProject,
  deleteProject,
  getProject,
  listUserProjects,
  updateProject,
  getProjectLogs,
} from "@controllers/projectControllers";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management endpoints
 */

/**
 * @swagger
 * /project:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - repositoryUrl
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               repositoryUrl:
 *                 type: string
 *               branch:
 *                 type: string
 *                 default: main
 *               envVars:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                     value:
 *                       type: string
 *     responses:
 *       201:
 *         description: Project created successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/create", authenticateToken, createProject as RequestHandler);

/**
 * @swagger
 * /project/list:
 *   get:
 *     summary: Get all projects for the authenticated user
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   repositoryUrl:
 *                     type: string
 *                   status:
 *                     type: string
 *                   branch:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/list", authenticateToken, listUserProjects as RequestHandler);

/**
 * @swagger
 * /project/{id}:
 *   get:
 *     summary: Get a project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project details
 *       404:
 *         description: Project not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", authenticateToken, getProject as RequestHandler);

/**
 * @swagger
 * /project/{id}:
 *   put:
 *     summary: Update a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               branch:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, suspended, archived]
 *               envVars:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                     value:
 *                       type: string
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       404:
 *         description: Project not found
 *       401:
 *         description: Unauthorized
 */
router.put("/:id", authenticateToken, updateProject as RequestHandler);

/**
 * @swagger
 * /project/{id}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       404:
 *         description: Project not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", authenticateToken, deleteProject as RequestHandler);

/**
 * @swagger
 * /project/{id}/logs:
 *   get:
 *     summary: Get logs for a specific project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 100
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Project logs retrieved successfully
 *       404:
 *         description: Project not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id/logs", authenticateToken, getProjectLogs as RequestHandler);

export default router;