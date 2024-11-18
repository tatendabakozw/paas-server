import { LocalWorkspace } from "@pulumi/pulumi/automation";
import { PROJECT_NAME } from "@utils/constants";
import * as path from "path";

export async function teardownProject(projectName: string) {
  const stackName = `stack-${projectName}`;
  const args = {
    stackName,
    projectName: PROJECT_NAME,
    workDir: path.resolve(__dirname, "../infrastructure"),
  };

  try {
    console.log("Selecting Pulumi stack for deletion...");
    const stack = await LocalWorkspace.createOrSelectStack(args);

    console.log("Destroying resources...");
    await stack.destroy({
      onOutput: console.log, // Logs the Pulumi output for debugging
    });

    console.log("Stack destroyed successfully.");
    return true;
  } catch (error) {
    console.error("Error during stack teardown:", error);
    throw new Error("Failed to destroy project resources");
  }
}
