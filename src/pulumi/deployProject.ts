import { LocalWorkspace } from "@pulumi/pulumi/automation";
import { PROJECT_NAME } from "@utils/constants";
import * as path from "path";

export async function deployProject(projectName: string) {
  const stackName = `stack-${projectName}`;

  const args = {
    stackName,
    projectName: PROJECT_NAME,
    workDir: path.resolve(__dirname, "../infrastructure"),
  };

  try {
    console.log("Creating or selecting Pulumi stack...");
    const stack = await LocalWorkspace.createOrSelectStack(args);

    console.log("Setting configuration...");
    await stack.setConfig("aws:region", { value: "us-west-2" });

    console.log("Starting Pulumi stack deployment...");
    const result = await stack.up({
      onOutput: console.log, // Logs the Pulumi output for easier debugging
    });

    console.log("Deployment complete.");
    return result.outputs;
  } catch (error) {
    console.error("Error during deployment:", error);
    throw new Error("Pulumi deployment failed");
  }
}
