import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

// Create a new VPC
const vpc = new aws.ec2.Vpc("app-vpc", {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
        Name: "app-vpc"
    }
});

// Create subnets in the VPC
const subnet1 = new aws.ec2.Subnet("app-subnet-1", {
    vpcId: vpc.id,
    cidrBlock: "10.0.1.0/24",
    availabilityZone: "us-west-2a",
    mapPublicIpOnLaunch: true,  // Enable auto-assign public IP
    tags: {
        Name: "app-subnet-1"
    }
});

const subnet2 = new aws.ec2.Subnet("app-subnet-2", {
    vpcId: vpc.id,
    cidrBlock: "10.0.2.0/24",
    availabilityZone: "us-west-2b",
    mapPublicIpOnLaunch: true,  // Enable auto-assign public IP
    tags: {
        Name: "app-subnet-2"
    }
});

// Create Internet Gateway
const internetGateway = new aws.ec2.InternetGateway("app-igw", {
    vpcId: vpc.id,
    tags: {
        Name: "app-igw"
    }
});

// Create Route Table
const routeTable = new aws.ec2.RouteTable("app-rt", {
    vpcId: vpc.id,
    routes: [
        {
            cidrBlock: "0.0.0.0/0",
            gatewayId: internetGateway.id,
        },
    ],
    tags: {
        Name: "app-rt"
    }
});

// Associate Route Table with Subnets
const rtAssociation1 = new aws.ec2.RouteTableAssociation("rta-1", {
    subnetId: subnet1.id,
    routeTableId: routeTable.id,
});

const rtAssociation2 = new aws.ec2.RouteTableAssociation("rta-2", {
    subnetId: subnet2.id,
    routeTableId: routeTable.id,
});

// Create Security Group
const securityGroup = new aws.ec2.SecurityGroup("app-sg", {
    vpcId: vpc.id,
    description: "Security group for application",
    ingress: [
        {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ["0.0.0.0/0"],
        },
        {
            protocol: "tcp",
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ["0.0.0.0/0"],
        }
    ],
    egress: [
        {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
        },
    ],
    tags: {
        Name: "app-sg"
    }
});

// Create Application Load Balancer
const lb = new awsx.lb.ApplicationLoadBalancer("app-lb", {
    securityGroups: [securityGroup.id],
    subnetIds: [subnet1.id, subnet2.id],
    defaultTargetGroup: {
        port: 80,
        protocol: "HTTP",
        healthCheck: {
            path: "/health",
            port: "80",
            protocol: "HTTP",
        },
    },
    tags: {
        Name: "app-lb"
    }
});

// Create ECS Cluster
const cluster = new aws.ecs.Cluster("app-cluster", {
    tags: {
        Name: "app-cluster"
    }
});

// Create S3 Bucket
const bucket = new aws.s3.Bucket("app-bucket", {
    bucketPrefix: "project-",
    forceDestroy: true,  // Allow deleting non-empty bucket
    tags: {
        Name: "app-bucket"
    }
});

// Export important values
export const vpcId = vpc.id;
export const subnetIds = [subnet1.id, subnet2.id];
export const securityGroupId = securityGroup.id;
export const loadBalancerDnsName = lb.loadBalancer.dnsName;
export const clusterArn = cluster.arn;
export const bucketName = bucket.id;