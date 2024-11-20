import { Schema, model, Document, Types } from "mongoose";

export interface EnvVar {
  key: string;
  value: string;
}

interface DeploymentConfig {
  instanceType: string;
  minInstances: number;
  maxInstances: number;
  port: number;
  healthCheckPath: string;
  memory: number;
  cpu: number;
}

export interface ProjectDocument extends Document {
  name: string;
  description?: string;
  userId: Types.ObjectId;
  status: "active" | "suspended" | "archived";
  envVars: EnvVar[];
  repositoryUrl: string;
  branch: string;
  createdAt: Date;
  updatedAt: Date;
  deployment?: DeploymentConfig;
  deploymentStatus: "not_deployed" | "deploying" | "deployed" | "failed";
  deploymentUrl?: string;
  lastDeployedAt?: Date;
  environment?: string;
}

const EnvVarSchema = new Schema<EnvVar>({
  key: { type: String, required: true },
  value: { type: String, required: true },
});

const DeploymentConfigSchema = new Schema<DeploymentConfig>({
  instanceType: { type: String, default: "t3.micro" },
  minInstances: { type: Number, default: 1 },
  maxInstances: { type: Number, default: 1 },
  port: { type: Number, default: 3000 },
  healthCheckPath: { type: String, default: "/health" },
  memory: { type: Number, default: 512 }, // MB
  cpu: { type: Number, default: 256 }, // CPU units (256 = 0.25 vCPU)
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
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "suspended", "archived"],
      default: "active",
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
      default: "main",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    deployment: DeploymentConfigSchema,
    deploymentStatus: {
      type: String,
      enum: ["not_deployed", "deploying", "deployed", "failed"],
      default: "not_deployed",
    },
    deploymentUrl: String,
    lastDeployedAt: Date,
  },
  {
    timestamps: true,
  }
);

ProjectSchema.pre<ProjectDocument>("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Project = model<ProjectDocument>("Project", ProjectSchema);

export default Project;
