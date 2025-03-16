import Project from "@models/projectModel";
import User from "@models/userModel";
import { Request, Response } from "express";
import { HydratedDocument, Types } from "mongoose";
import logger from "@utils/logger";
import { logActivity } from "@services/activityService";
import { deployProject } from "@helpers/deployProject";
import { readFile } from 'fs/promises';
import path from 'path';
import Activity from "@models/activityModel";
import crypto from 'crypto';
import { EnvVar } from "src/types/env.types";

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
  const correlationId = crypto.randomUUID(); // Add request tracking
  const startTime = Date.now();

  try {
    // Authentication check with detailed logging
    if (!req.user?.userId) {
      logger.warn(`Unauthorized project creation attempt`, { correlationId });
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
      projectType,
      buildCommand,
      startCommand,
    } = req.body;

    const _user = await User.findById(req.user.userId);

    if (!_user) {
      res.status(401).json({
        success: false,
        error: "USER_NOT_FOUND",
        message: "User account not found"
      });
      return;
    }

    // Enhanced validation logging
    logger.info(`Starting project creation`, {
      correlationId,
      userId: req.user.userId,
      projectName: name,
      projectType
    });

    const formatedEnvVars = envVars?.map((env:EnvVar) => ({
      key: env.key,
      value: env.value,
      isSecret: env.isSecret || false,
      description: env.description || ''
    })) || [];

    console.log("formatted env, ", formatedEnvVars)

    // Project creation with progress logging
    logger.info(`Creating project document`, { correlationId });
    const project = new Project({
      name,
      description,
      userId: new Types.ObjectId(req.user.userId),
      repositoryUrl,
      branch: branch || "main",
      projectType,
      buildCommand: buildCommand?.trim() || null,
      startCommand: startCommand?.trim() || null,
      envVars: formatedEnvVars
    });

    // Enhanced activity logging
    await logActivity({
      userId: req.user.userId,
      action: "PROJECT_CREATED",
      details: `Created new project: ${name}`,
      projectId: project._id,
      metadata: {
        correlationId,
        projectName: name,
        repositoryUrl,
        branch,
        projectType,
        creationDuration: Date.now() - startTime,
        environmentVariablesCount: Object.keys(project.envVars).length
      },
    });

    const projectConfig = {
      metadata: {
        repositoryUrl,
        branch: branch || "main",
        build: buildCommand?.trim() || null,
        start: startCommand?.trim() || null,
      },
      envVars: formatedEnvVars,
      instanceType: "s-1vcpu-1gb",
      region: "nyc1",
      githubToken: _user.githubAccessToken?.toString(),
      projectType
    }

    // Deployment with status tracking
    logger.info(`Starting project deployment`, { correlationId, projectId: project._id });
    project.deploymentStatus = "deploying";
    await project.save();

    // Move deploymentResult declaration outside the try block
    let deploymentResult: any;

    try {
      deploymentResult = await deployProject(name, projectConfig);
      if (!deploymentResult.success) {
        logger.error(`Deployment failed`, {
          correlationId,
          projectId: project._id,
          error: deploymentResult.raw,
          config: {
            ...projectConfig,
            githubToken: '[REDACTED]' // Avoid logging sensitive data
          }
        });
        project.deploymentStatus = "failed";
        // project.lastError = deploymentResult.raw;
        await project.save();
        
        res.status(400).json({
          success: false,
          error: "DEPLOYMENT_FAILED",
          message: "Project created but deployment failed",
          details: deploymentResult.raw,
          projectId: project._id
        });
        return;
      }
    } catch (deployError) {
      logger.error(`Deployment exception`, {
        correlationId,
        projectId: project._id,
        error: deployError instanceof Error ? deployError.message : 'Unknown error',
        stack: deployError instanceof Error ? deployError.stack : undefined
      });
      
      project.deploymentStatus = "failed";
      // project.lastError = deployError instanceof Error ? deployError.message : 'Unknown error';
      await project.save();
      
      throw deployError; // Let the main error handler deal with it
    }

    // Now deploymentResult is accessible here
    const duration = Date.now() - startTime;
    logger.info(`Project created and deployed successfully`, {
      correlationId,
      projectId: project._id,
      duration,
      deploymentUrl: deploymentResult.deploymentDetails.appUrl
    });

    project.deploymentStatus = "deployed";
    project.deploymentUrl = deploymentResult.deploymentDetails.appUrl;
    project.lastDeployedAt = new Date();
    await project.save();

    res.status(201).json({
      success: true,
      message: "Project created and deployed successfully",
      data: {
        project: project.toJSON(),
        deployment: {
          status: project.deploymentStatus,
          url: project.deploymentUrl,
          duration,
          correlationId
        }
      }
    });

  } catch (error:any) {
    const errorId = crypto.randomUUID();
    logger.error(`Project creation failed`, {
      correlationId,
      errorId,
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack,
        // Add mongoose validation error details
        validationErrors: error.name === 'ValidationError' ? (error as any).errors : undefined
      } : error,
      duration: Date.now() - startTime
    });
    console.error(error)

    // Send appropriate status code for validation errors
    const statusCode = error.name === 'ValidationError' ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.name === 'ValidationError' ? 'VALIDATION_ERROR' : 'SERVER_ERROR',
      message: error.message,
      errorId,
      correlationId
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

// Get project logs
export const getProjectLogs = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const { limit = 100, startDate, endDate } = req.query;

    // First verify the project exists and belongs to the user
    const project = await Project.findOne({
      _id: id,
      userId: new Types.ObjectId(req.user.userId),
    });

    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    // Get both system logs and activity logs
    const [systemLogs, activityLogs] = await Promise.all([
      // Get system logs from the log file
      readProjectSystemLogs(project.name, {
        limit: Number(limit),
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      }),
      // Get activity logs from the database
      Activity.find({
        projectId: new Types.ObjectId(id),
        ...(startDate && { timestamp: { $gte: new Date(startDate as string) } }),
        ...(endDate && { timestamp: { $lte: new Date(endDate as string) } }),
      })
        .sort({ timestamp: -1 })
        .limit(Number(limit))
    ]);

    // Combine and sort all logs by timestamp
    const combinedLogs = [
      ...systemLogs.map(log => ({
        ...log,
        type: 'system'
      })),
      ...activityLogs.map(log => ({
        timestamp: log.timestamp,
        level: 'info',
        message: log.details,
        action: log.action,
        metadata: log.metadata,
        type: 'activity'
      }))
    ].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    res.status(200).json({
      projectId: id,
      projectName: project.name,
      logs: combinedLogs
    });
  } catch (error) {
    logger.error("Failed to retrieve project logs:", error);
    res.status(500).json({
      message: "Failed to retrieve project logs",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Helper function to read system logs
async function readProjectSystemLogs(projectName: string, options: {
  limit?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const logPath = path.join(process.cwd(), 'logs', 'combined.log');
    const logContent = await readFile(logPath, 'utf-8');

    // Parse log lines and filter by project name
    const logs = logContent
      .split('\n')
      .filter(line => line.trim())
      .filter(line => line.includes(projectName))
      .map(line => {
        const [timestamp, level, ...messageParts] = line.split(' ');
        return {
          timestamp: new Date(timestamp),
          level: level.replace('[', '').replace(']:', '').toLowerCase(),
          message: messageParts.join(' ')
        };
      })
      .filter(log => {
        if (options.startDate && log.timestamp < options.startDate) return false;
        if (options.endDate && log.timestamp > options.endDate) return false;
        return true;
      })
      .slice(0, options.limit);

    return logs;
  } catch (error) {
    logger.error(`Error reading system logs for project ${projectName}:`, error);
    return [];
  }
}
