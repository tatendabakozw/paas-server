import Activity, { ActivityAction } from '@models/activityModel';
import { Types } from 'mongoose';
import logger from '@utils/logger';

interface LogActivityParams {
  userId: string;
  action: ActivityAction;
  details: string;
  projectId?: any;
  metadata?: Record<string, any>;
}

export const logActivity = async ({
  userId,
  action,
  details,
  projectId,
  metadata
}: LogActivityParams): Promise<void> => {
  try {
    const activity = new Activity({
      userId: new Types.ObjectId(userId),
      action,
      details,
      ...(projectId && { projectId: new Types.ObjectId(projectId) }),
      ...(metadata && { metadata }),
      timestamp: new Date()
    });

    await activity.save();
    logger.info(`Activity logged: ${action} by user: ${userId}`);
  } catch (error) {
    logger.error('Failed to log activity:', error);
  }
};