import * as digitalocean from "@pulumi/digitalocean";
import * as pulumi from "@pulumi/pulumi";
import axios from 'axios';

// Define the helper function for droplet creation
export function createDroplet(projectName: string, projectConfig: any): digitalocean.Droplet {
    const dropletSize = projectConfig.instanceType || "s-1vcpu-1gb";
    const dropletRegion = projectConfig.region || "nyc1";
    const dropletImage = projectConfig.image || "ubuntu-20-04-x64";
    
    return new digitalocean.Droplet(`${projectName}-droplet`, {
        image: dropletImage,
        region: dropletRegion,
        size: dropletSize,
        tags: [projectName],
        name: `${projectName}-server`,
    });
}

// Helper function to get droplet IP after deployment
export function getDropletIp(droplet: digitalocean.Droplet): pulumi.Output<string> {
    return droplet.ipv4Address.apply(ip => {
        if (!ip) {
            throw new Error("Failed to get droplet IP address.");
        }
        return ip;
    });
}

// Check if a droplet exists and return its info
export async function checkIfDropletExists(dropletName: string): Promise<boolean> {
    try {
        const doToken = process.env.DIGITALOCEAN_TOKEN;
        if (!doToken) {
            throw new Error("DIGITALOCEAN_TOKEN not found in environment");
        }

        const response = await axios.get('https://api.digitalocean.com/v2/droplets', {
            headers: {
                'Authorization': `Bearer ${doToken}`
            }
        });

        const droplets = response.data.droplets;
        return droplets.some((droplet: any) => droplet.name === dropletName);
    } catch (error) {
        console.error("Error checking droplet:", error);
        return false;
    }
}