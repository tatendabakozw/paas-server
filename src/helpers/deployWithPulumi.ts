import * as fs from "fs-extra";
import * as path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as docker from "@pulumi/docker";
import * as awsx from "@pulumi/awsx";
import Project from "@models/projectModel";
import { ECR_REPO_NAME } from "@utils/constants";
import { createDockerImage } from "./dockerHelpers";
import { EnvironmentVariable } from "./folderHelpers";

export async function createSecurityGroup(tag: string) {
  // Get reference to existing VPC
  const vpc = new aws.ec2.Vpc("app-vpc", {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
      Name: "app-vpc",
    },
  });

  return new aws.ec2.SecurityGroup(`${tag}-sg`, {
    vpcId: vpc.id,
    description: `Security group for ${tag}`,
    ingress: [
      { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
      {
        protocol: "tcp",
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ["0.0.0.0/0"],
      },
    ],
    egress: [
      { protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] },
    ],
    tags: {
      Name: `${tag}-security-group`,
    },
  });
}

// Pulumi deployment helper functions
export async function getECRCredentials(repo: aws.ecr.Repository) {
  return pulumi.output(repo.registryId).apply(async (registryId) => {
    const credentials = await aws.ecr.getCredentials({ registryId });
    const decodedCredentials = Buffer.from(
      credentials.authorizationToken,
      "base64"
    ).toString();
    const [username, password] = decodedCredentials.split(":");
    return {
      server: credentials.proxyEndpoint,
      username,
      password,
    };
  });
}

export async function createLoadBalancer(
  tag: string,
  securityGroup: aws.ec2.SecurityGroup,
  subnets: aws.ec2.Subnet[]
) {
  return new awsx.lb.ApplicationLoadBalancer(`${tag}-lb`, {
    securityGroups: [securityGroup.id],
    subnetIds: subnets.map((s) => s.id),
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
      Name: `${tag}-lb`,
    },
  });
}
export async function createFargateService(
    tag: string,
    lb: awsx.lb.ApplicationLoadBalancer,
    logGroup: aws.cloudwatch.LogGroup,
    envJson: EnvironmentVariable[],
    image: docker.Image,
    vpc: aws.ec2.Vpc,
    subnets: aws.ec2.Subnet[],
    securityGroup: aws.ec2.SecurityGroup
  ) {
    // Create a new ECS cluster
    const cluster = new aws.ecs.Cluster("app-cluster", {
        name: "app-cluster",
        settings: [{
            name: "containerInsights",
            value: "enabled"
        }],
        tags: {
            Name: "app-cluster"
        }
    });
  
    // Create IAM role for ECS task execution
    const taskExecutionRole = new aws.iam.Role(`${tag}-task-execution-role`, {
        assumeRolePolicy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Action: "sts:AssumeRole",
                Effect: "Allow",
                Principal: {
                    Service: "ecs-tasks.amazonaws.com"
                }
            }]
        })
    });
  
    // Attach required policies to the task execution role
    new aws.iam.RolePolicyAttachment(`${tag}-task-execution-policy`, {
        role: taskExecutionRole,
        policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
    });
  
    // Create task definition with the role
    const taskDefinition = new aws.ecs.TaskDefinition(`${tag}-task`, {
      family: `${tag}-task`,
      cpu: "256",
      memory: "512",
      networkMode: "awsvpc",
      requiresCompatibilities: ["FARGATE"],
      executionRoleArn: taskExecutionRole.arn,
      taskRoleArn: taskExecutionRole.arn,
      containerDefinitions: pulumi.all([image.imageName]).apply(([imageName]) => {
          // Log the image name for debugging
          console.log("Full image name:", imageName);
          
          return JSON.stringify([
              {
                  name: tag,
                  image: imageName,
                  essential: true,
                  portMappings: [
                      {
                          containerPort: 80,
                          hostPort: 80,
                          protocol: "tcp"
                      }
                  ],
                  environment: envJson,
                  logConfiguration: {
                      logDriver: "awslogs",
                      options: {
                          "awslogs-group": logGroup.name,
                          "awslogs-region": aws.config.region,
                          "awslogs-stream-prefix": tag
                      }
                  }
              }
          ]);
      })
  });
  
    // Create ECS Service
    const service = new aws.ecs.Service(`${tag}-service`, {
        cluster: cluster.id,
        desiredCount: 1,
        launchType: "FARGATE",
        taskDefinition: taskDefinition.arn,
        networkConfiguration: {
            assignPublicIp: true,
            subnets: subnets.map(s => s.id),
            securityGroups: [securityGroup.id]
        },
        loadBalancers: [{
            targetGroupArn: lb.defaultTargetGroup.arn,
            containerName: tag,
            containerPort: 80
        }],
        forceNewDeployment: true,
        waitForSteadyState: false,
        tags: {
            Name: `${tag}-service`
        }
    });
  
    return {
        service: service,
        taskDefinition: taskDefinition
    };
  }

export async function pulumiProgram(): Promise<void> {
  try {
    const filePath = path.join(__dirname, "/../userApp/");
    const files = await fs.readdir(filePath);
    console.log("files found", files);
    if (files.length > 0) {
      const filename = files[0];
      const fullFilePath = path.join(__dirname, "/../userApp/" + filename);
      const [, title, githubId, repository, state] = filename.split(",");

      const shortId = githubId.substring(0, 6);
      const shortTitle = title.substring(0, 6).replace(/[^a-zA-Z0-9]/g, '');
      const tag = `${shortId}-${shortTitle}`;
        console.log("Generated tag:", tag);


      // Create VPC and networking resources
      const vpc = new aws.ec2.Vpc("app-vpc", {
        cidrBlock: "10.0.0.0/16",
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: "app-vpc",
        },
      });

      // Create subnets
      const subnet1 = new aws.ec2.Subnet("app-subnet-1", {
        vpcId: vpc.id,
        cidrBlock: "10.0.1.0/24",
        availabilityZone: "us-east-1a",
        mapPublicIpOnLaunch: true,
        tags: {
          Name: "app-subnet-1",
        },
      });

      const subnet2 = new aws.ec2.Subnet("app-subnet-2", {
        vpcId: vpc.id,
        cidrBlock: "10.0.2.0/24",
        availabilityZone: "us-east-1b",
        mapPublicIpOnLaunch: true,
        tags: {
          Name: "app-subnet-2",
        },
      });

      // Create Internet Gateway
      const internetGateway = new aws.ec2.InternetGateway("app-igw", {
        vpcId: vpc.id,
        tags: {
          Name: "app-igw",
        },
      });

      // Create route table
      const routeTable = new aws.ec2.RouteTable("app-rt", {
        vpcId: vpc.id,
        routes: [
          {
            cidrBlock: "0.0.0.0/0",
            gatewayId: internetGateway.id,
          },
        ],
        tags: {
          Name: "app-rt",
        },
      });

      // Associate route table with subnets
      const rtAssociation1 = new aws.ec2.RouteTableAssociation("rta-1", {
        subnetId: subnet1.id,
        routeTableId: routeTable.id,
      });

      const rtAssociation2 = new aws.ec2.RouteTableAssociation("rta-2", {
        subnetId: subnet2.id,
        routeTableId: routeTable.id,
      });

      // Create security group
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
          Name: "app-sg",
        },
      });

      if (!process.env.ECR_REPO_NAME)
        throw new Error("ECR_REPO_NAME environment variable is required");
      const repo = aws.ecr.Repository.get(ECR_REPO_NAME, ECR_REPO_NAME);

      console.log("got repo reference!!!");
      console.log("getting credentials");

      console.log("repo created!!!");
      console.log("getting credentials");
      const registry = await getECRCredentials(repo);
      console.log("credentials received!!!");

      const image = await createDockerImage(
        tag,
        repo.repositoryUrl,
        fullFilePath,
        registry
      );
      console.log("image created!!!");

      const lb = await createLoadBalancer(tag, securityGroup, [
        subnet1,
        subnet2,
      ]);
      console.log("Load balancer created!!!");
      const logGroup = new aws.cloudwatch.LogGroup("app-log-group", {});

      const envJson = await fs.readJSON(
        path.join(fullFilePath, "/config.json")
      );

      const service = await createFargateService(
        tag,
        lb,
        logGroup,
        envJson,
        image,
        vpc,
        [subnet1, subnet2],
        securityGroup
      );
      console.log("Fargate service created");

      lb.loadBalancer.dnsName.apply(async (dnsName) => {
        image.imageName.apply(async (imageName) => {
          if (state === "new") {
            await Project.findOneAndUpdate(
              { name: title },
              {
                $set: {
                  name: title,
                  deploymentUrl: dnsName,
                },
              },
              { new: true }
            );
          }
        });
      });
    }
  } catch (error) {
    console.error("Pulumi program error:", error);
    throw error;
  }
}
