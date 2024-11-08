import Project from '@models/projectModel';
import { Request, Response } from 'express';
import { HydratedDocument, Types } from 'mongoose';
import logger from '@utils/logger';
import { logActivity } from '@services/activityService';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    _id?: string;
    email?: string;
  }
}

// Create a new project
export const createProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { name, description, repositoryUrl, branch, envVars } = req.body;
    const project = new Project({
      name,
      description,
      userId: new Types.ObjectId(req.user.userId),
      repositoryUrl,
      branch,
      envVars,
    }) as any;

    await project.save();

    // Log activity
    await logActivity({
      userId: req.user.userId,
      action: 'PROJECT_CREATED',
      details: `Created new project: ${name}`,
      projectId: project._id.toString(),
      metadata: {
        projectName: name,
        repositoryUrl,
        branch
      }
    });

    res.status(201).json(project);
  } catch (error) {
    logger.error('Failed to create project:', error);
    res.status(500).json({ message: 'Failed to create project', error });
  }
};
// List all projects for a user
export const listUserProjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const projects = await Project.find({ userId: new Types.ObjectId(req.user.userId) });
    res.status(200).json(projects);
  } catch (error) {
    logger.error('Failed to retrieve projects:', error);
    res.status(500).json({ message: 'Failed to retrieve projects', error });
  }
};

// Get a project by ID
export const getProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const project = await Project.findOne({
      _id: id,
      userId: new Types.ObjectId(req.user.userId)
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    res.status(200).json(project);
  } catch (error) {
    logger.error('Failed to retrieve project:', error);
    res.status(500).json({ message: 'Failed to retrieve project', error });
  }
};

// Update project
export const updateProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const project = await Project.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(req.user.userId) },
      req.body,
      { new: true }
    ) as HydratedDocument<typeof Project>;

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Log activity
    await logActivity({
      userId: req.user.userId,
      action: 'PROJECT_UPDATED',
      details: `Updated project: ${project.name}`,
      projectId: project._id.toString(),
      metadata: {
        updatedFields: Object.keys(req.body),
        projectName: project.name
      }
    })

    res.status(200).json(project);
  } catch (error) {
    logger.error('Failed to update project:', error);
    res.status(500).json({ message: 'Failed to update project', error });
  }
};

// Delete project
export const deleteProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const project = await Project.findOneAndDelete({
      _id: id,
      userId: new Types.ObjectId(req.user.userId)
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete project:', error);
    res.status(500).json({ message: 'Failed to delete project', error });
  }
};