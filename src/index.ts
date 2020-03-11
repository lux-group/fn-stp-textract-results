import { S3, Textract } from "aws-sdk";
import { RESULTS_S3_BUCKET_NAME } from "./config";

// const s3 = new S3();
const textract = new Textract();
import { SNSEvent } from "aws-lambda";

export const handler = async (event: SNSEvent): Promise<string> => {
  console.log(JSON.stringify(event, null, 2));
  console.log(RESULTS_S3_BUCKET_NAME);

  const { Sns } = event.Records[0];
  const message = JSON.parse(Sns.Message);
  console.log(JSON.stringify(message, null, 2));
  if (message.Status === "SUCCEEDED") {
    // Get textract results and store in S3
    const textractResults = await textract
      .getDocumentAnalysis({
        JobId: message.JobId
      })
      .promise();
    console.log(JSON.stringify(textractResults, null, 2));
  } else {
    // Create error results and store in S3 (log?)
  }
  return "Finished processing.";
};
