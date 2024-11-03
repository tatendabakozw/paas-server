import Project from '@models/projectModel';
import { Request, Response } from 'express';
import { Types } from 'mongoose';

// Create a new project
export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, userId, repositoryUrl, branch, envVars } = req.body;
    const project = new Project({
      name,
      description,
      userId: new Types.ObjectId(userId),
      repositoryUrl,
      branch,
      envVars,
    });
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create project', error });
  }
};

// List all projects for a user
export const listUserProjects = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const projects = await Project.find({ userId: new Types.ObjectId(userId) });
      res.status(200).json(projects);
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve projects', error });
    }
  };

// Get a project by ID
export const getProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve project', error });
  }
};

// Update a project
export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedProject = await Project.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedProject) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    res.status(200).json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update project', error });
  }
};

// Delete a project
export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedProject = await Project.findByIdAndDelete(id);
    if (!deletedProject) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete project', error });
  }
};


