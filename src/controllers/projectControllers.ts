import Project from "@models/projectModel";
import User from "@models/userModel";
import { Request, Response } from "express";
import { HydratedDocument, Types } from "mongoose";
import logger from "@utils/logger";
import { logActivity } from "@services/activityService";
import { deployProject } from "src/pulumi/deployProject";
import { teardownProject } from "src/pulumi/teardownProject";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    _id?: string;
    email?: string;
  };
}

// Create a new project and deploy it
export const createProject = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Check if the user is authenticated
    if (!req.user?.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const {
      name,
      description,
      repositoryUrl,
      branch,
      envVars,
      runtime,
      version,
      build,
      start,
      root
    } = req.body;

    const projectInfo ={
      name,
      repositoryUrl,
      branch,
      envVars
    };

    if (!name || !repositoryUrl) {
       res.status(400).json({ error: "Missing required fields: projectName, userId, repositoryUrl" });
       return
    }

    const nameRegex = /^[a-zA-Z0-9-_]+$/; // Only allow alphanumeric characters, hyphens, and underscores
    if (!nameRegex.test(name)) {
      res.status(400).json({ message: "Project name must not contain special characters or spaces." });
      return;
    }

    const _user = await User.findById(req.user.userId);

    if (!_user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    // Create the project document
    const project = new Project({
      name,
      description,
      userId: new Types.ObjectId(req.user.userId),
      repositoryUrl,
      branch,
      envVars,
    }) as any;

    await project.save();

    // extraxt username and repo name from repositoryUrl
    const [username, repoName] = repositoryUrl.split("/").slice(-2);

    // Log activity for project creation
    await logActivity({
      userId: req.user.userId,
      action: "PROJECT_CREATED",
      details: `Created new project: ${name}`,
      projectId: project._id.toString(),
      metadata: {
        projectName: name,
        repositoryUrl,
        branch,
      },
    });


    const outputs = await deployProject({githubId: _user.githubId, projectName: name, repoName: repoName, branch: "main", envVars, username: username, accessToken: _user.githubAccessToken});
    // Log activity for project creation
    await logActivity({
      userId: req.user.userId,
      action: "PROJECT_DEPLOYED",
      details: `Deployed project with name: ${name}`,
      projectId: project._id.toString(),
      metadata: {
        projectName: name,
        repositoryUrl,
        branch,
      },
    });
 
    await project.save();

    res.status(201).json({
      message: "Project created and deployed successfully",
      projectId: project._id.toString(),
      success: true, outputs
    });
  } catch (error) {
    console.error("Failed to create project:", error);
    res.status(500).json({ message: "Failed to create project", error });
  }
};

// List all projects for a user
export const listUserProjects = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const projects = await Project.find({
      userId: new Types.ObjectId(req.user.userId),
    });
    res.status(200).json(projects);
  } catch (error) {
    logger.error("Failed to retrieve projects:", error);
    res.status(500).json({ message: "Failed to retrieve projects", error });
  }
};

// Get a project by ID
export const getProject = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const project = await Project.findOne({
      _id: id,
      userId: new Types.ObjectId(req.user.userId),
    });

    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }
    res.status(200).json(project);
  } catch (error) {
    logger.error("Failed to retrieve project:", error);
    res.status(500).json({ message: "Failed to retrieve project", error });
  }
};

// Update project
export const updateProject = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const project = (await Project.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(req.user.userId) },
      req.body,
      { new: true }
    )) as HydratedDocument<typeof Project>;

    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    // Log activity
    await logActivity({
      userId: req.user.userId,
      action: "PROJECT_UPDATED",
      details: `Updated project: ${project.name}`,
      projectId: project._id.toString(),
      metadata: {
        updatedFields: Object.keys(req.body),
        projectName: project.name,
      },
    });

    res.status(200).json(project);
  } catch (error) {
    logger.error("Failed to update project:", error);
    res.status(500).json({ message: "Failed to update project", error });
  }
};

// Delete project
export const deleteProject = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { id } = req.query;
    console.log(id)
    const project = await Project.findOneAndDelete({
      _id: new Types.ObjectId(id as string),
      userId: new Types.ObjectId(req.user.userId),
    });

    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }
    // Step 2: Update project status to "suspended" before teardown
    project.status = "suspended";
    project.deploymentStatus = "not_deployed";

    // Step 3: Call Pulumi to destroy resources
    await teardownProject(project.name);

    // Step 4: Update project status to "archived" after successful teardown
    project.status = "archived";

    await project.save();
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    logger.error("Failed to delete project:", error);
    res.status(500).json({ message: "Failed to delete project", error });
  }
};
