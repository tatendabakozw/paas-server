import { exec } from 'child_process';

// Check if the Pulumi stack already exists
export function checkIfStackExists(stackName: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        // Use fully qualified stack name with organization
        exec(`pulumi stack ls --json`, (error, stdout) => {
            if (error) {
                return reject(error);
            }
            try {
                const stacks = JSON.parse(stdout);
                // Look for exact stack match
                const stackExists = stacks.some((stack: any) => 
                    stack.name === stackName || 
                    stack.fullName === stackName
                );
                resolve(stackExists);
            } catch (e) {
                reject(e);
            }
        });
    });
}

// Create a new Pulumi stack
export function createPulumiStack(stackName: string): Promise<string> {
    return new Promise((resolve, reject) => {
        // First remove any existing stack with this name
        exec(`pulumi stack rm ${stackName} --force --yes`, () => {
            // Then create the new stack
            exec(`pulumi stack init ${stackName} --non-interactive`, (error, stdout, stderr) => {
                if (error) {
                    return reject(stderr);
                }
                resolve(stdout);
            });
        });
    });
}