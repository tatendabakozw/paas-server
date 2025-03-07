import { checkIfStackExists, createPulumiStack } from './pulumi/pulumuHelpers';
import { execPromise } from './shellHelper';

export async function deployProject(projectName: string, projectConfig: any) {
    const stackName = `project-stack-${projectName}`;

    console.log("stack name: ", stackName);
    const stackExists = await checkIfStackExists(stackName);
    console.log("stack exists: ", stackExists);
  
    if (!stackExists) {
        await createPulumiStack(stackName);
        await execPromise(`pulumi config set projectName ${projectName} --stack ${stackName}`);
        // Escape the repository URL properly
        const escapedRepoUrl = projectConfig.metadata.repositoryUrl.replace(/"/g, '\\"');
        await execPromise(`pulumi config set repositoryUrl "${escapedRepoUrl}" --stack ${stackName}`);
        await execPromise(`pulumi config set githubToken "${projectConfig.githubToken}" --secret --stack ${stackName}`);
        if (projectConfig.metadata.branch) {
            await execPromise(`pulumi config set branch "${projectConfig.metadata.branch}" --stack ${stackName}`);
        }
    }

    try {
        const result = await execPromise(`pulumi up --stack ${stackName} --yes`);
        // Get the outputs after deployment
        const outputs = await execPromise(`pulumi stack output --stack ${stackName} --json`);
        const parsedOutputs = JSON.parse(outputs);

        return {
            success: true,
            deploymentDetails: {
                stackName,
                dropletIp: parsedOutputs.dropletIp,
                dropletId: parsedOutputs.dropletId,
                status: 'deployed'
            },
            raw: result
        };
    } catch (error) {
        console.error("Error during Pulumi deployment:", error);
        throw new Error("Failed to deploy project");
    }
}
