import {
  pulumiProgram,
} from "@helpers/deployWithPulumi";
import * as path from "path";
import * as fs from "fs-extra";
import * as auto from '@pulumi/pulumi/automation';
import { emptyUserAppDirectory, processEnvironmentVariables, renameProjectDirectory } from "@helpers/folderHelpers";
import { downloadRepositoryZip, saveAndExtractRepository } from "@helpers/githubHelpers";
import { createDockerfile } from "@helpers/dockerHelpers";


export interface DockerProps {
  runtime: string;
  version: string;
  root: string;
  build: string;
  start: string;
};

interface ProjectItemProps {
  branch: string;
  envVars: string;
  username: string;
  repoName: string;
  accessToken?: string | undefined;
  dockerProps?: DockerProps;
  projectName: string;
  githubId: any;
};

export async function deployProject({
  branch,
  envVars,
  username,
  repoName,
  accessToken,
  dockerProps,
  projectName,
  githubId,
}: ProjectItemProps) {
  try {
    await emptyUserAppDirectory();
    
    if (!branch || !username || !repoName || !accessToken) {
      throw new Error("Missing required fields");
    }

    const downloadUrl = await downloadRepositoryZip(
      username,
      repoName,
      branch,
      accessToken
    );
    const userApp = path.join(__dirname, "/../userApp");
    const target = path.join(__dirname, "/../userApp/bootstrap.zip");

    const files = await saveAndExtractRepository(downloadUrl, userApp, target);
    console.log("Repository extracted!", files);

    const projectDir = files.filter(file => file !== "bootstrap.zip")[0];
    const projectPath = path.join(userApp, projectDir);

    const envJson = processEnvironmentVariables(envVars);
    await fs.writeJSON(path.join(projectPath, "config.json"), envJson);

    console.log("Environment variables written!", envJson);

    const dockerProps: DockerProps = {
      runtime: "node",          // Base image
      version: "16",            // Version of the base image
      root: ".",                // Root directory to copy
      build: "npm install",     // Build command
      start: "npm start",       // Start command
    };

    const dockerfileContent = createDockerfile({dockerProps});
    const dockerfilePath = path.join(projectPath, "Dockerfile");

    await fs.writeFile(dockerfilePath, dockerfileContent);
    console.log("Dockerfile written!", dockerfilePath);

    // const newProjectPath = path.join(
    //   __dirname,
    //   `/../userApp/${projectDir},${projectName},${req.cookies.id},${repo},${req.params.state}`
    // );
    const newProjectPath = path.join(
      __dirname,
      `/../userApp/${projectDir},${projectName},${githubId.toString()},${repoName},${"new"}`
    );
    await renameProjectDirectory(projectPath, newProjectPath);
    console.log("Project directory renamed!", newProjectPath);

    // Run Pulumi deployment
    const stack = await auto.LocalWorkspace.selectStack({
      stackName: "dev",
      projectName: "paas-infrastructure",
      program: pulumiProgram,
    });
    console.log("stack selected", stack);
    await stack.workspace.installPlugin("aws", "v4.0.0");
    console.log("installed plugin");
    const upResult = await stack.up({ 
      onOutput: console.info,
      parallel: 1,
  refresh: true
    });
    console.log("up result", upResult);
    return upResult;

  } catch (error) {
    console.error("Error during deployment:", error);
    throw new Error("Pulumi deployment failed");
  }
}
