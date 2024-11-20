import * as docker from "@pulumi/docker";
import * as pulumi from "@pulumi/pulumi";
import { DockerProps } from "src/pulumi/deployProject";

export async function createDockerImage(
  tag: string, 
  repositoryUrl: pulumi.Output<string>,
  filePath: string, 
  registry: any
): Promise<docker.Image> {
  // Ensure tag is short and valid
  const shortTag = tag.substring(0, 8);
  console.log(`Creating Docker image with tag: ${shortTag}`);

  const buildOptions = {
    context: filePath,
    args: {
        DOCKER_BUILDKIT: "1"
    },
    platform: "linux/amd64",
    dockerfile: `${filePath}/Dockerfile`,
    // Optimize build performance
    options: {
        timeout: 300,
        memory: 4096, // Increase memory limit
        memorySwap: 4096,
        buildArgs: {
            BUILDKIT_INLINE_CACHE: "1"
        },
        // Add caching options
        cacheFrom: [pulumi.interpolate`${repositoryUrl}:${shortTag}`],
        pull: true // Always pull latest base image
    }
};

  try {
    const image = new docker.Image(shortTag, {
      imageName: pulumi.interpolate`${repositoryUrl}:${shortTag}`,
      build: buildOptions,
      registry: {
          server: registry.server,
          username: registry.username,
          password: registry.password
      },
      skipPush: false,
  }, {
      // Add resource options for better dependency management
      deleteBeforeReplace: true,
      replaceOnChanges: ["*"],
      retainOnDelete: false,
  });

  // Log the image name without creating a dependency cycle
  console.log(`Docker image tag: ${shortTag}`);
  return image;
  } catch (error: any) {
      console.error('Error in Docker image creation:', error);
      if (error.message?.includes('timeout')) {
          throw new Error('Docker build timed out - check Dockerfile for inefficient build steps');
      } else if (error.message?.includes('no space left on device')) {
          throw new Error('Docker build failed - insufficient disk space');
      } else if (error.message?.includes('network timeout')) {
          throw new Error('Docker build failed - network connectivity issues');
      }
      throw error;
  }
}
    // Helper function to create Dockerfile
export function createDockerfile({
  dockerProps
}: {
  dockerProps: DockerProps
}): string {
  return `FROM ${dockerProps.runtime}:${dockerProps.version}
COPY ${dockerProps.root} /app
WORKDIR /app
COPY . .
RUN ${dockerProps.build}
CMD ${dockerProps.start}`;
}
