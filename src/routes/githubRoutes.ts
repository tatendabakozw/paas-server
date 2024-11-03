import { Router } from "express";
import { authenticateToken } from "@middlewares/auth";
import { GITHUB_CALLBACK_URL, GITHUB_CLIENT_ID } from "@utils/constants";
import { installGitub } from "@controllers/githubControllers";

const router = Router();

// if user already created account by did not create with github
// add user gitubn info to profile
//POST request
router.post("/install", installGitub);

// return a list of users gitub repos
// get request
// /api/github/repos/:token
router.get("/repos", authenticateToken, async (req, res, next) => {
  try {
  } catch (error) {
    next(error);
  }
});

module.exports = router;
