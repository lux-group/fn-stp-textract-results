export const ENVIRONMENT = process.env.NODE_ENV || "test";

export const PRODUCTION = ENVIRONMENT === "production";

export const APP_NAME = process.env.APP_NAME || "test-fn-stp-textract-results";

export const DEBUG = process.env.DEBUG === "true";

export const DATA_S3_BUCKET_NAME = process.env.DATA_S3_BUCKET_NAME || "";
export const RESULTS_S3_BUCKET_NAME = process.env.RESULTS_S3_BUCKET_NAME || "";

export const SNS_CHANNEL = process.env.SNS_CHANNEL || "";

export const SNS_ROLE_ARN = process.env.SNS_ROLE_ARN || "";
