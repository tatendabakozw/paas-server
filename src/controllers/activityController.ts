import { Request, Response } from 'express';
import Activity from '@models/activityModel';
import { Types } from 'mongoose';
import logger from '@utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    _id?: string;
    email?: string;
  }
}

export const getProjectActivities = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
  
      const { projectId } = req.params;
  
      // Only fetch project activities for the authenticated user
      const activities = await Activity.find({ 
        projectId: new Types.ObjectId(projectId),
        userId: new Types.ObjectId(req.user.userId)
      })
      .sort({ timestamp: -1 })
      .limit(50);
  
      res.status(200).json(activities);
    } catch (error) {
      logger.error('Failed to fetch activities:', error);
      res.status(500).json({ message: 'Failed to fetch activities', error });
    }
  };

export const getUserActivities = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
  
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
  
      // Only fetch activities for the authenticated user
      const activities = await Activity.find({ 
        userId: new Types.ObjectId(req.user.userId) 
      })
      .populate('projectId', 'name')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  
      const total = await Activity.countDocuments({ 
        userId: new Types.ObjectId(req.user.userId) 
      });
  
      res.status(200).json({
        activities,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          hasMore: page * limit < total
        }
      });
    } catch (error) {
      logger.error('Failed to fetch activities:', error);
      res.status(500).json({ message: 'Failed to fetch activities', error });
    }
  };
  