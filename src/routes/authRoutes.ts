import { Router } from "express";
const router = Router();
import passport from "passport";
import { loginUser, logoutUser, refreshToken, registerUser } from "@controllers/authControllers";

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: User already exists
 *       500:
 *         description: Error registering user
 */
router.post(
  "/register",
 registerUser
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user and obtain access and refresh tokens
 *     tags: [Auth]
 *     description: This endpoint authenticates a user using their email and password, and returns an access token in the response body and a refresh token in an HttpOnly cookie.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "userpassword123"
 *     responses:
 *       200:
 *         description: Login successful. Access token returned in response body, refresh token set as HttpOnly cookie.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: The JWT access token used for authenticating API requests.
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Failed to log in
 *     security: []
 *     examples:
 *       Request:
 *         value:
 *           email: "user@example.com"
 *           password: "userpassword123"
 *       Response:
 *         value:
 *           accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */

router.post("/login", passport.authenticate("local"), loginUser);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
 *     description: |
 *       This endpoint generates a new access token using the refresh token stored in an HttpOnly cookie.
 *       - **Access Token**: The new access token is returned in the response body.
 *       - **Refresh Token**: The refresh token should be sent in an HttpOnly cookie in the request.
 *     responses:
 *       200:
 *         description: New access token generated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: The new JWT access token for authenticating API requests.
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Unauthorized. Refresh token missing from the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized. Refresh token missing."
 *       403:
 *         description: Invalid or expired refresh token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid or expired refresh token"
 *     security: []
 *     examples:
 *       Request (cookie-based):
 *         description: HttpOnly refresh token sent in the cookie.
 *         value:
 *           Cookie: "refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       Response:
 *         value:
 *           accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */
router.post("/refresh-token", refreshToken);


/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout the user and clear the refresh token
 *     tags: [Auth]
 *     description: |
 *       This endpoint logs out the user by clearing the refresh token cookie and ending the user's session.
 *       - **Refresh Token**: The refresh token stored in an HttpOnly cookie is cleared.
 *       - **Session**: If using Passport, the user's session is also terminated.
 *     responses:
 *       200:
 *         description: Logout successful. Refresh token cookie cleared and session ended.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logout successful"
 *       500:
 *         description: Failed to log out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to log out"
 *     security: []
 */
router.post("/logout", logoutUser);


export default router;
