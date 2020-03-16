import { S3, Textract } from "aws-sdk";
import { DATA_S3_BUCKET_NAME } from "./config";
import { RESULTS_S3_BUCKET_NAME } from "./config";

const s3 = new S3();
const textract = new Textract();
import { SNSEvent } from "aws-lambda";

interface KeyValuePairs {
  [key: string]: string;
}

interface BlockMap {
  [key: string]: Textract.Block;
}

export const handler = async (event: SNSEvent): Promise<string> => {
  // console.log(JSON.stringify(event, null, 2));

  const { Sns } = event.Records[0];
  const message = JSON.parse(Sns.Message);
  const { S3ObjectName } = message.DocumentLocation;
  const d = new Date(message.Timestamp);
  const s3prefix = `${message.JobTag || "unknown"}/${d
    .toISOString()
    .replace(/-/g, "/")
    .replace(/:/g, "-")}`;
  const fileName = S3ObjectName.split("/").slice(-1)[0];
  const metaDataS3ObjectName = S3ObjectName.replace(fileName, "_meta.json");
  let error = null;

  //console.log(JSON.stringify(message, null, 2));

  if (message.Status === "SUCCEEDED") {
    // Get textract results and store in S3
    try {
      const textractResults = await textract
        .getDocumentAnalysis({
          JobId: message.JobId
        })
        .promise();

      const blocks: Textract.BlockList = textractResults.Blocks || [];

      console.log("Collecting Key Value Pairs...");

      const keyMap: BlockMap = {};
      const valueMap: BlockMap = {};
      const blockMap: BlockMap = {};

      for (const block of blocks) {
        const blockId: string = block.Id || "";
        blockMap[blockId] = block;
        if (block.BlockType == "KEY_VALUE_SET") {
          const entityTypes = block.EntityTypes || [];
          if (entityTypes.some(et => et == "KEY")) {
            keyMap[blockId] = block;
          } else {
            valueMap[blockId] = block;
          }
        }
      }

      const findValueBlock = (
        keyBlock: Textract.Block
      ): Textract.Block | undefined => {
        for (const relationShip of keyBlock.Relationships || []) {
          if (relationShip.Type === "VALUE" && relationShip.Ids?.length) {
            return valueMap[relationShip.Ids[0]];
          }
        }
      };

      const getText = (block: Textract.Block, blockMap: BlockMap): string => {
        let text = "";
        for (const relationShip of block.Relationships || []) {
          if (relationShip.Type === "CHILD" && relationShip.Ids?.length) {
            for (const childId of relationShip.Ids) {
              const word = blockMap[childId];
              if (word.BlockType === "WORD") {
                text = text + word.Text + " ";
              } else if (
                word.BlockType == "SELECTION_ELEMENT" &&
                word.SelectionStatus === "SELECTED"
              ) {
                text = text + "X ";
              }
            }
          }
        }
        return text.trimEnd();
      };

      const kvp: KeyValuePairs = {};

      for (const k in keyMap) {
        const keyBlock = keyMap[k];
        const valueBlock = findValueBlock(keyBlock);
        if (valueBlock) {
          let key: string = getText(keyBlock, blockMap);
          const value: string = getText(valueBlock, blockMap);
          let duplicateNumber = 1;
          while (kvp[key]) {
            key = key + duplicateNumber;
            duplicateNumber++;
          }
          kvp[key] = value;
        }
      }

      console.log("Writing key value pairs...");
      await s3
        .putObject({
          Bucket: RESULTS_S3_BUCKET_NAME,
          Key: `extracted/${s3prefix}/${fileName}.kvp.json`,
          Body: JSON.stringify(kvp, null, 2)
        })
        .promise();

      console.log("Writing block results...");
      await s3
        .putObject({
          Bucket: RESULTS_S3_BUCKET_NAME,
          Key: `extracted/${s3prefix}/${fileName}.blocks.json`,
          Body: JSON.stringify(textractResults, null, 2)
        })
        .promise();

      console.log("Copying original file...");
      await s3
        .copyObject({
          CopySource: `${DATA_S3_BUCKET_NAME}/${S3ObjectName}`,
          Bucket: RESULTS_S3_BUCKET_NAME,
          Key: `extracted/${s3prefix}/${fileName}`
        })
        .promise();

      console.log("Copying metadata...");
      await s3
        .copyObject({
          CopySource: `${DATA_S3_BUCKET_NAME}/${metaDataS3ObjectName}`,
          Bucket: RESULTS_S3_BUCKET_NAME,
          Key: `extracted/${s3prefix}/meta.json`
        })
        .promise();
    } catch (err) {
      error = { type: "Output error", message: { err } };
    }
  } else {
    error = { type: "Textract failed", message: { message } };
  }
  return error?.message
    ? JSON.stringify(error, null, 2)
    : "Finished processing.";
};
