import * as pulumi from "@pulumi/pulumi";

// Load Pulumi configuration
const config = new pulumi.Config();

// AWS configuration
export const awsConfig = {
    region: config.get("awsRegion") || "us-east-1",
    project: config.get("project") || "paas",
    environment: pulumi.getStack(),
};

// VPC configuration
export const vpcConfig = {
    cidrBlock: "10.0.0.0/16",
    publicSubnetCidrs: ["10.0.1.0/24", "10.0.2.0/24"],
    privateSubnetCidrs: ["10.0.3.0/24", "10.0.4.0/24"],
    availabilityZones: ["us-east-1a", "us-east-1b"],
};

// Tags configuration
export const defaultTags = {
    Project: awsConfig.project,
    Environment: awsConfig.environment,
    ManagedBy: "pulumi",
};