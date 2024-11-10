import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { vpcConfig, defaultTags } from "./config";

export class VPCStack extends pulumi.ComponentResource {
    public vpc: aws.ec2.Vpc;
    public publicSubnets: aws.ec2.Subnet[];
    public privateSubnets: aws.ec2.Subnet[];
    public internetGateway: aws.ec2.InternetGateway;
    public publicRouteTable: aws.ec2.RouteTable;
    public privateRouteTables: aws.ec2.RouteTable[];

    constructor(name: string, opts?: pulumi.ComponentResourceOptions) {
        super("custom:x:VPCStack", name, {}, opts);

        // Create VPC
        this.vpc = new aws.ec2.Vpc("main", {
            cidrBlock: vpcConfig.cidrBlock,
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: { ...defaultTags, Name: `${name}-vpc` },
        }, { parent: this });

        // Create Internet Gateway
        this.internetGateway = new aws.ec2.InternetGateway("main", {
            vpcId: this.vpc.id,
            tags: { ...defaultTags, Name: `${name}-igw` },
        }, { parent: this });

        // Create public subnets
        this.publicSubnets = vpcConfig.publicSubnetCidrs.map((cidr, index) => {
            return new aws.ec2.Subnet(`public-${index + 1}`, {
                vpcId: this.vpc.id,
                cidrBlock: cidr,
                availabilityZone: vpcConfig.availabilityZones[index],
                mapPublicIpOnLaunch: true,
                tags: { ...defaultTags, Name: `${name}-public-${index + 1}` },
            }, { parent: this });
        });

        // Create private subnets
        this.privateSubnets = vpcConfig.privateSubnetCidrs.map((cidr, index) => {
            return new aws.ec2.Subnet(`private-${index + 1}`, {
                vpcId: this.vpc.id,
                cidrBlock: cidr,
                availabilityZone: vpcConfig.availabilityZones[index],
                tags: { ...defaultTags, Name: `${name}-private-${index + 1}` },
            }, { parent: this });
        });

        // Create public route table
        this.publicRouteTable = new aws.ec2.RouteTable("public", {
            vpcId: this.vpc.id,
            routes: [{
                cidrBlock: "0.0.0.0/0",
                gatewayId: this.internetGateway.id,
            }],
            tags: { ...defaultTags, Name: `${name}-public-rt` },
        }, { parent: this });

        // Associate public subnets with public route table
        this.publicSubnets.forEach((subnet, index) => {
            new aws.ec2.RouteTableAssociation(`public-${index + 1}`, {
                subnetId: subnet.id,
                routeTableId: this.publicRouteTable.id,
            }, { parent: this });
        });

        // Create private route tables (one per subnet)
        this.privateRouteTables = this.privateSubnets.map((subnet, index) => {
            return new aws.ec2.RouteTable(`private-${index + 1}`, {
                vpcId: this.vpc.id,
                tags: { ...defaultTags, Name: `${name}-private-rt-${index + 1}` },
            }, { parent: this });
        });

        // Associate private subnets with their respective route tables
        this.privateSubnets.forEach((subnet, index) => {
            new aws.ec2.RouteTableAssociation(`private-${index + 1}`, {
                subnetId: subnet.id,
                routeTableId: this.privateRouteTables[index].id,
            }, { parent: this });
        });

        // Register outputs
        this.registerOutputs({
            vpcId: this.vpc.id,
            publicSubnetIds: this.publicSubnets.map(subnet => subnet.id),
            privateSubnetIds: this.privateSubnets.map(subnet => subnet.id),
        });
    }
}