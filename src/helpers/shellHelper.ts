import { exec } from 'child_process';

// Helper function to execute shell commands (e.g., Pulumi commands)
export function execPromise(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          return reject(stderr);
        }
        resolve(stdout);
      });
    });
  }
  