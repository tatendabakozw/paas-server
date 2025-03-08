import * as pulumi from "@pulumi/pulumi";
import * as digitalocean from "@pulumi/digitalocean";

// Get config
const config = new pulumi.Config();
const projectName = config.require("projectName");
const repoUrl = config.require("repositoryUrl");
const branch = config.get("branch") || "main";
const githubToken = config.require("githubToken");

// Create the provider explicitly
const provider = new digitalocean.Provider("do", {
    token: process.env.DIGITALOCEAN_TOKEN
});

// Create user data script for initial setup
const userData = pulumi.interpolate`#!/bin/bash
set -e

# Log start of script
echo "Starting deployment script" > /var/log/deployment.log

# Update system and install dependencies
apt-get update -y >> /var/log/deployment.log 2>&1
apt-get install -y git nodejs npm >> /var/log/deployment.log 2>&1

# Configure git to use the token for authentication
git config --global credential.helper store
echo "https://x-access-token:${githubToken}@github.com" > /root/.git-credentials

# Extract the repository path (owner/repo) from the URL
REPO_PATH=$(echo ${repoUrl} | sed 's/.*github.com[:/]\\(.*\\)\\.git/\\1/')
echo "Repository path: $REPO_PATH" >> /var/log/deployment.log 2>&1

# Clone using HTTPS with token
echo "Cloning repository..." >> /var/log/deployment.log 2>&1
mkdir -p /opt >> /var/log/deployment.log 2>&1
cd /opt || { echo "Failed to change to /opt directory" >> /var/log/deployment.log 2>&1; exit 1; }

git clone "https://x-access-token:${githubToken}@github.com/${repoUrl}" "${projectName}" >> /var/log/deployment.log 2>&1
if [ $? -ne 0 ]; then
    echo "Failed to clone repository" >> /var/log/deployment.log 2>&1
    exit 1
fi

cd "${projectName}" || { echo "Failed to change to project directory" >> /var/log/deployment.log 2>&1; exit 1; }

# If a specific branch is specified, check it out
if [ "${branch}" != "main" ]; then
    echo "Checking out branch: ${branch}" >> /var/log/deployment.log 2>&1
    git checkout ${branch} >> /var/log/deployment.log 2>&1
fi

# Clean up credentials after clone
rm /root/.git-credentials

# Install dependencies and start the application
npm install --legacy-peer-deps >> /var/log/deployment.log 2>&1
npm run build >> /var/log/deployment.log 2>&1

# Log completion
echo "Script completed" >> /var/log/deployment.log 2>&1
`;

// Create the droplet using the provider
const droplet = new digitalocean.Droplet(`${projectName}-droplet`, {
    image: "ubuntu-20-04-x64",
    region: "nyc1",
    size: "s-1vcpu-1gb",
    tags: [projectName],
    name: `${projectName}-server`,
    userData: userData,
}, { provider: provider });

// Export values
export const dropletIp = droplet.ipv4Address;
export const dropletId = droplet.id;
