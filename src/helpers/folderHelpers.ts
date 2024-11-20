import * as path from "path";
import * as fs from "fs-extra";

export interface EnvironmentVariable {
  name: string;
  value: string;
}

// Helper function to empty user app directory
export async function emptyUserAppDirectory(): Promise<void> {
    try {
      await fs.emptyDir(path.join(__dirname, "/../userApp"));
      console.log("Emptied the contents of userApp!");
    } catch (err) {
      console.error("Error emptying userApp directory:", err);
    }
  }

    // Helper function to rename project directory
export async function renameProjectDirectory(
  oldPath: string, 
  newPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.rename(oldPath, newPath, (err) => {
      if (err) {
        console.log("Error renaming directory:", err);
        reject(err);
      } else {
        console.log("Renamed directory");
        resolve();
      }
    });
  });
}

// Helper function to process environment variables
export function processEnvironmentVariables(env?: string): EnvironmentVariable[] {
  // Default to an empty array if `env` is not provided
  const envJson = env
    ? env.split("\n").map(ele => {
        const [name, value] = ele.split("=");
        return { name, value };
      })
    : [];

  // Add a default PORT variable
  envJson.push({ name: "PORT", value: "80" });

  return envJson;
}

