import Project from "@models/projectModel";
import User from "@models/userModel";
import { Request, Response } from "express";
import { HydratedDocument, Types } from "mongoose";
import logger from "@utils/logger";
import { logActivity } from "@services/activityService";
import { deployProject } from "@helpers/deployProject";

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
  // Check if the user is authenticated
  if (!req.user?.userId) {
    res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "User authentication required"
    });
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

  

  // Validate required fields
  if (!name || !repositoryUrl) {
    res.status(400).json({
      success: false,
      error: "MISSING_FIELDS",
      message: "Missing required fields: name and repositoryUrl are required"
    });
    return;
  }

  // Validate project name format
  const nameRegex = /^[a-zA-Z0-9-_]+$/;
  if (!nameRegex.test(name)) {
    res.status(400).json({
      success: false,
      error: "INVALID_NAME_FORMAT",
      message: "Project name must only contain alphanumeric characters, hyphens, and underscores"
    });
    return;
  }

  const _user = await User.findById(req.user.userId);


  if (!_user) {
    res.status(401).json({
      success: false,
      error: "USER_NOT_FOUND",
      message: "User account not found"
    });
    return;
  }
  try {

    // Create the project document
    const project = new Project({
      name,
      description,
      userId: new Types.ObjectId(req.user.userId),
      repositoryUrl,
      branch: branch || "main",
      envVars,
    });



    // Log activity for project creation
    await logActivity({
      userId: req.user.userId,
      action: "PROJECT_CREATED",
      details: `Created new project: ${name}`,
      projectId: project._id,
      metadata: {
        projectName: name,
        repositoryUrl,
        branch,
      },
    });

    await project.save()

    const projectConfig = {
      metadata: {
        repositoryUrl,
        branch: branch || "main",
        runtime,
        version,
        build,
        start,
        root
      },
      envVars: envVars || {},  // Environment variables for the application
      instanceType: "s-1vcpu-1gb", // Can be made configurable if needed
      region: "nyc1",  // Can be made configurable if needed
      githubToken: _user.githubAccessToken?.toString()
    }
    const projectName = name

    const deploymentResult = await deployProject(projectName, projectConfig);

    if (!deploymentResult.success) {
      throw new Error(deploymentResult.raw || 'Deployment failed');
    }

    project.deploymentStatus = "deployed";
    project.deploymentUrl = deploymentResult.deploymentDetails.dropletIp;
    project.lastDeployedAt = new Date();

    await project.save();


    res.status(201).json({
      success: true,
      message: "Project created and deployed successfully",
      data: {
        project: {
          id: project._id,
          name: project.name,
          repositoryUrl: project.repositoryUrl,
          branch: project.branch,
          status: project.status,
        },
        deployment: {
          status: project.deploymentStatus,
          url: project.deploymentUrl,
          lastDeployedAt: project.lastDeployedAt,
          dropletId: "project.dropletId",
        }
      }
    });


  } catch (error) {
    logger.error("Failed to create project:", error);
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "An unexpected error occurred while creating the project",
      precise: error
    });
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

    // Step 4: Update project status to "archived" after successful teardown
    project.status = "archived";

    await project.save();
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    logger.error("Failed to delete project:", error);
    res.status(500).json({ message: "Failed to delete project", error });
  }
};
