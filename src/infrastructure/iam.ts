import * as aws from "@pulumi/aws";

// Create ECS Task Execution Role
export const createEcsTaskExecutionRole = () => {
    const role = new aws.iam.Role("ecsTaskExecutionRole", {
        assumeRolePolicy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Action: "sts:AssumeRole",
                Effect: "Allow",
                Principal: {
                    Service: "ecs-tasks.amazonaws.com",
                },
            }],
        }),
    });

    new aws.iam.RolePolicyAttachment("ecsTaskExecutionRolePolicy", {
        role: role.name,
        policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
    });

    return role;
};