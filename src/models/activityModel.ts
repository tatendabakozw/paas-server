import { Schema, model, Document, Types } from 'mongoose';

export type ActivityAction = 
  | 'PROJECT_CREATED' 
  | 'PROJECT_UPDATED'
  | 'PROJECT_DELETED'
  | 'PROJECT_DEPLOYED'
  | 'DEPLOYMENT_FAILED'
  | 'USER_LOGGED_IN'
  | 'GITHUB_CONNECTED'
  | 'ENV_VARS_UPDATED'
  | 'BRANCH_CHANGED';

export interface ActivityDocument extends Document {
  userId: Types.ObjectId;
  projectId?: Types.ObjectId;
  action: ActivityAction;
  details: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

const ActivitySchema = new Schema<ActivityDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: false,
    },
    action: {
      type: String,
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
ActivitySchema.index({ userId: 1, timestamp: -1 });
ActivitySchema.index({ projectId: 1, timestamp: -1 });

export default model<ActivityDocument>('Activity', ActivitySchema);