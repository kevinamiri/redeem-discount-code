import {
  APIGatewayProxyEvent,
  APIGatewayProxyResultV2,
  Handler,
} from "aws-lambda";
// import fetch from "node-fetch"
import * as AWS from "aws-sdk";

AWS.config.update({ region: "us-east-2" });

const docClient = new AWS.DynamoDB.DocumentClient();

async function getItem(n) {
  try {
    const data = await docClient.get(n).promise();
    return data;
  } catch (err) {
    return err;
  }
}

export const handler: Handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResultV2> => {
  // let requestContexts = event.requestContext.authorizer;
  // const user = requestContexts.claims.sub;
  // const useremail = requestContexts.claims.email;
  let bodyEvent = JSON.parse(event.body);
  const email = bodyEvent.email;
  const voucher = bodyEvent.voucher;

  /**
   * 1. Check if the user has already redeemed a discount code ProjectionExpression is used to only return the code attribute
   * To read data from a table, you use operations such as GetItem, Query, or Scan. Amazon DynamoDB returns all the item attributes by default.
   *  To get only some, rather than all of the attributes, use a projection expression.
   */

  const params = {
    TableName: "redeemcodes",
    FilterExpression: "voucher = :voucher",
    ExpressionAttributeValues: {
      ":voucher": voucher,
    },
    ProjectionExpression: "status, voucher",
  };

  const data = await getItem(params);

  // const statusVoucher = data.Items[0].status === "redeemable" ? true : false;

  // if statusVoucher true then update the status to redeemed
  // if (statusVoucher) {
  //   const paramsUsage = {
  //     TableName: "redeem-discount-code",
  //     Key: {
  //       code: voucher,
  //     },
  //     UpdateExpression: "set #status = :status",
  //     ExpressionAttributeNames: {
  //       "#status": "status",
  //     },
  //     ExpressionAttributeValues: {
  //       ":status": "redeemed",
  //     },
  //     ReturnValues: "UPDATED_NEW",
  //   };

  //   const data = await docClient.update(paramsUsage).promise();
  // }

  let { Item } = data;
  console.log(data);
  let userDataInfo = { ...Item };
  userDataInfo["statusVoucher"] = voucher;

  let res = {};
  res["statusCode"] = 200;
  res["headers"] = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };
  res["body"] = JSON.stringify(userDataInfo);

  return res;
};
