import * as pulumi from "@pulumi/pulumi";
import * as digitalocean from "@pulumi/digitalocean";

// Get config
const config = new pulumi.Config();
const projectName = config.require("projectName");

// Create the provider explicitly
const provider = new digitalocean.Provider("do", {
    token: process.env.DIGITALOCEAN_TOKEN
});

// Create the droplet using the provider
const droplet = new digitalocean.Droplet(`${projectName}-droplet`, {
    image: "ubuntu-20-04-x64",
    region: "nyc1",
    size: "s-1vcpu-1gb",
    tags: [projectName],
    name: `${projectName}-server`,
}, { provider: provider });

// Export values
export const dropletIp = droplet.ipv4Address;
export const dropletId = droplet.id; 