import * as aws from "@pulumi/aws";

// Example: S3 Bucket
const bucket = new aws.s3.Bucket("userBucket", {
  bucketPrefix: "project-",
});

export const bucketName = bucket.id;
