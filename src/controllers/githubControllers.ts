import {
  GITHUB_API_URL,
  GITHUB_CALLBACK_URL,
  GITHUB_CLIENT_ID,
} from "@utils/constants";
import { NextFunction, Request, Response } from "express";
import User from "@models/userModel";
import axios from "axios";
import { SessionUser } from "src/types/user";

interface RequestWithUser extends Request {
  user?: SessionUser;
}

export const installGitub = async (
  req: Request,
  res: any,
  next: NextFunction
) => {
  try {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${GITHUB_CALLBACK_URL}&scope=user,repo`;
    res.json({ redirectUrl: githubAuthUrl });
    return;
  } catch (error) {
    next(error);
  }
};

export const getUserRepositories = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  // console.log(req.user);
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const per_page = parseInt(req.query.per_page as string) || 10;

    const user = await User.findById(userId);
    if (!user?.githubAccessToken) {
      res.status(401).json({
        error:
          "GitHub integration not found. Please connect your GitHub account first.",
      });
      return;
    }
    // Fetch repositories from GitHub API with pagination
    const response = await axios.get(`${GITHUB_API_URL}/user/repos`, {
      headers: {
        Authorization: `Bearer ${user.githubAccessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
      params: {
        sort: "updated",
        per_page,
        page,
      },
    });

    //  Get total count from GitHub API response headers
    const linkHeader = response.headers.link;
    const lastPageMatch = linkHeader?.match(/page=(\d+)>; rel="last"/);
    const totalPages = lastPageMatch ? parseInt(lastPageMatch[1]) : page;

    // Transform the response to include only needed data
    const repositories = response.data.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      description: repo.description,
      url: repo.html_url,
      defaultBranch: repo.default_branch,
      updatedAt: repo.updated_at,
    }));
    // Return paginated response
    res.status(200).json({
      data: repositories,
      pagination: {
        currentPage: page,
        totalPages,
        perPage: per_page,
        total: totalPages * per_page, // This is an approximation
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};

export const getRepositoryInfo = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const { owner, repo } = req.params; // Get from URL parameters

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const user = await User.findById(userId);
    if (!user?.githubAccessToken) {
      res.status(401).json({
        error:
          "GitHub integration not found. Please connect your GitHub account first.",
      });
      return;
    }

    try {
      const response = await axios.get(
        `${GITHUB_API_URL}/repos/${owner}/${repo}`,
        {
          headers: {
            Authorization: `Bearer ${user.githubAccessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      // Transform the response to include relevant data
      const repository = {
        id: response.data.id,
        name: response.data.name,
        fullName: response.data.full_name,
        private: response.data.private,
        description: response.data.description,
        url: response.data.html_url,
        defaultBranch: response.data.default_branch,
        updatedAt: response.data.updated_at,
        createdAt: response.data.created_at,
        language: response.data.language,
        topics: response.data.topics,
        stargazersCount: response.data.stargazers_count,
        forksCount: response.data.forks_count,
        watchersCount: response.data.watchers_count,
        openIssuesCount: response.data.open_issues_count,
        hasIssues: response.data.has_issues,
        hasProjects: response.data.has_projects,
        hasWiki: response.data.has_wiki,
        homepage: response.data.homepage,
        license: response.data.license,
        owner: {
          id: response.data.owner.id,
          login: response.data.owner.login,
          avatarUrl: response.data.owner.avatar_url,
          url: response.data.owner.html_url,
        },
      };
      res.status(200).json(repository);

      return;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return res.status(404).json({ error: "Repository not found" });
      }
      if (error?.response?.status === 401) {
        return res.status(401).json({
          error: "GitHub token expired. Please reconnect your GitHub account.",
          code: "GITHUB_RECONNECT_REQUIRED",
        });
      }
      throw error;
    }
  } catch (error: any) {
    console.error("Error fetching repository:", error);
    return res.status(500).json({
      error: "Failed to fetch repository information",
      message: error.message,
    });
  }
}; //   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     // Get user from database to access their GitHub token
//     const user = await User.findById(req.user?.userId);

//     if (!user?.githubAccessToken) {
//       res.status(401).json({
//         error:
//           "GitHub integration not found. Please connect your GitHub account first.",
//       });
//       return;
//     }

//     // Fetch repositories from GitHub API
//     const response = await axios.get(`${GITHUB_API_URL}/user/repos`, {
//       headers: {
//         Authorization: `Bearer ${user.githubAccessToken}`,
//         Accept: "application/vnd.github.v3+json",
//       },
//       params: {
//         sort: "updated",
//         per_page: 100, // Adjust as needed
//       },
//     });

//     // Transform the response to include only needed data
//     const repositories = response.data.map((repo: any) => ({
//       id: repo.id,
//       name: repo.name,
//       fullName: repo.full_name,
//       private: repo.private,
//       description: repo.description,
//       url: repo.html_url,
//       defaultBranch: repo.default_branch,
//       updatedAt: repo.updated_at,
//     }));

//     res.status(200).json(repositories);
//     return;
//   } catch (error: any) {
//     if (error.response?.status === 401) {
//       return res.status(401).json({
//         error:
//           "GitHub token expired or invalid. Please reconnect your GitHub account.",
//       });
//     }

//     console.error("Error fetching GitHub repositories:", error);
//     next(error);
//   }
// };
