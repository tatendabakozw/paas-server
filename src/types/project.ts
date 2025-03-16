import { EnvVar } from "./env.types";
import { Schema, model, Document, Types } from "mongoose";

export interface DeploymentConfig {
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
    projectType?:"static-site" | "web-service";
    buildCommand?: string;
    startCommand?: string;
  }