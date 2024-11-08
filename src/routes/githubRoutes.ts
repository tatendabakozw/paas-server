import { RequestHandler, Router } from "express";
import { authenticateToken } from "@middlewares/auth";
import { getRepositoryInfo, getUserRepositories, installGitub } from "@controllers/githubControllers";

const router = Router();

// if user already created account by did not create with github
// add user gitubn info to profile
//POST request
router.post("/install", installGitub);

// return a list of users gitub repos
// get request
// /api/github/repos/:token
router.get("/repositories", authenticateToken, getUserRepositories as RequestHandler);

// get repository info
router.get("/repository/:owner/:repo", authenticateToken, getRepositoryInfo as RequestHandler);
export default router
