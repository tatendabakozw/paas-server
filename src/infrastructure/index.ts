import * as pulumi from "@pulumi/pulumi";
import * as digitalocean from "@pulumi/digitalocean";

// Get config
const config = new pulumi.Config();
const projectName = config.require("projectName");
const repoUrl = config.require("repositoryUrl");
const branch = config.get("branch") || "main";
const projectType = config.get("projectType") || "web-service";

// Validate project type
if (projectType !== "static-site" && projectType !== "web-service") {
    throw new Error('projectType must be either "static-site" or "web-service"');
}

// Create the provider explicitly
const provider = new digitalocean.Provider("do", {
    token: process.env.DIGITALOCEAN_TOKEN
});

// Helper function to convert GitHub URL to owner/repo format
const getRepoIdentifier = (url: string) => {
    // Handle URLs like https://github.com/owner/repo or git@github.com:owner/repo
    return url
        .replace('https://github.com/', '')
        .replace('git@github.com:', '')
        .replace('.git', '');
};

// Create an App with different configuration based on project type
const app = new digitalocean.App(`${projectName}-app`, {
    spec: {
        name: projectName,
        region: "nyc",
        ...(projectType === "static-site" 
            ? {
                staticSites: [{
                    name: "web",
                    buildCommand: "npm install --legacy-peer-deps && npm run build",
                    outputDir: "/dist", // Adjust this based on your build output directory
                    envs: [],
                    github: {
                        repo: getRepoIdentifier(repoUrl),
                        branch: branch,
                    },
                }],
              }
            : {
                services: [{
                    name: "web",
                    httpPort: 8080,
                    instanceCount: 1,
                    instanceSizeSlug: "basic-xxs",
                    sourceDir: "/",
                    github: {
                        repo: getRepoIdentifier(repoUrl),
                        branch: branch,
                    },
                    buildCommand: "npm install --legacy-peer-deps && npm run build",
                    runCommand: "npm start",
                    envs: [],
                    healthCheck: {
                        httpPath: "/",
                        initialDelaySeconds: 30,
                    }
                }],
              }
        ),
    }
}, { provider });

// Export values
export const appUrl = app.liveUrl;
export const appId = app.id;