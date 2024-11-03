import { Schema, model, Document, Types } from 'mongoose';

interface EnvVar {
  key: string;
  value: string;
}

export interface ProjectDocument extends Document {
  name: string;
  description?: string;
  userId: Types.ObjectId;
  status: 'active' | 'suspended' | 'archived';
  envVars: EnvVar[];
  repositoryUrl: string;
  branch: string;
  createdAt: Date;
  updatedAt: Date;
}

const EnvVarSchema = new Schema<EnvVar>({
  key: { type: String, required: true },
  value: { type: String, required: true },
});

const ProjectSchema = new Schema<ProjectDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'archived'],
      default: 'active',
    },
    envVars: {
      type: [EnvVarSchema],
      default: [],
    },
    repositoryUrl: {
      type: String,
      required: true,
    },
    branch: {
      type: String,
      default: 'main',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

ProjectSchema.pre<ProjectDocument>('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Project = model<ProjectDocument>('Project', ProjectSchema);

export default Project;
