import { checkIfStackExists, createPulumiStack } from './pulumi/pulumuHelpers';
import { execPromise } from './shellHelper';

export async function deployProject(projectName: string, projectConfig: any) {
    const stackName = `project-stack-${projectName}`;
    const stackExists = await checkIfStackExists(stackName);
  
    if (!stackExists) {
        await createPulumiStack(stackName);
        await execPromise(`pulumi config set projectName ${projectName} --stack ${stackName}`);
        // Escape the repository URL properly
        // const escapedRepoUrl = projectConfig.metadata.repositoryUrl.replace(/"/g, '\\"');
        await execPromise(`pulumi config set repositoryUrl "${projectConfig.metadata.repositoryUrl}" --stack ${stackName}`);
        await execPromise(`pulumi config set githubToken "${projectConfig.githubToken}" --secret --stack ${stackName}`);
        await execPromise(`pulumi config set githubToken "${projectConfig.projectType}" --stack ${stackName}`);
        if (projectConfig.metadata.branch) {
            await execPromise(`pulumi config set branch "${projectConfig.metadata.branch}" --stack ${stackName}`);
        }
    }

    try {
        const result = await execPromise(`pulumi up --stack ${stackName} --yes`);
        // Get the outputs after deployment
        const outputs = await execPromise(`pulumi stack output --stack ${stackName} --json`);
        const parsedOutputs = JSON.parse(outputs);

        console.log("results from deployment: ", parsedOutputs);

        return {
            success: true,
            deploymentDetails: {
                stackName,
                appUrl: parsedOutputs.appUrl,
                appId: parsedOutputs.appId,
                status: 'deployed',
                success: true
            },
            raw: result
        };
    } catch (error) {
        console.error("Error during Pulumi deployment:", error);
        throw new Error("Failed to deploy project");
    }
}
