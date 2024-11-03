import { GITHUB_CALLBACK_URL, GITHUB_CLIENT_ID } from "@utils/constants";
import { NextFunction, Request } from "express";

export const installGitub = async (req:Request, res:any, next:NextFunction) => {
    try {
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${GITHUB_CALLBACK_URL}&scope=user,repo`;
      res.json({ redirectUrl: githubAuthUrl });
      return;
    } catch (error) {
      next(error);
    }
  }