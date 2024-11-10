import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { VPCStack } from "./vpc";
import { awsConfig, defaultTags } from "./config";

// Configure AWS provider
const awsProvider = new aws.Provider("aws", {
    region: awsConfig.region as aws.Region,
    defaultTags: {
        tags: defaultTags,
    },
});

// Create VPC infrastructure
const vpcStack = new VPCStack("paas", {
    provider: awsProvider,
});

// Export important values
export const vpcId = vpcStack.vpc.id;
export const publicSubnetIds = vpcStack.publicSubnets.map(subnet => subnet.id);
export const privateSubnetIds = vpcStack.privateSubnets.map(subnet => subnet.id);