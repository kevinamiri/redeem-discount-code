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

// async function createItem(n) {
//   try {
//     await docClient.put(n).promise();
//   }
//   catch (err) {
//     return err;
//   }
// }

export const handler: Handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResultV2> => {
  let requestContexts = event.requestContext.authorizer;
  // const user = requestContexts.claims.sub;
  // const useremail = requestContexts.claims.email;
  let bodyEvent = JSON.parse(event.body);
  const email =
    bodyEvent.email ||
    (requestContexts.claims.email && requestContexts.claims.email);
  const voucher = bodyEvent.voucher;

  /**
   * 1. Check if the user has already redeemed a discount code ProjectionExpression is used to only return the code attribute
   * To read data from a table, you use operations such as GetItem, Query, or Scan. Amazon DynamoDB returns all the item attributes by default.
   *  To get only some, rather than all of the attributes, use a projection expression.
   */
  const params = {
    TableName: "redeem-discount-code",
    FilterExpression: "code = :code",
    ExpressionAttributeValues: {
      ":code": voucher,
    },
    ProjectionExpression: "status, code",
  };

  // following will
  // const paramsData = {
  //   TableName: "redeem-discount-code",
  //   AttributesToGet: ["status, code"],
  //   Key: {
  //     id: email,
  //   },
  // };

  const data = await getItem(params);

  const statusVoucher =
    data.Items[0].status === "redeemed"
      ? "The voucher has already been redeemed"
      : "You have successfully redeemed the voucher";
  let { Item } = data;
  console.log(data);
  let userDataInfo = { ...Item };
  userDataInfo["statusVoucher"] = statusVoucher;

  let res = {};
  res["statusCode"] = 200;
  res["headers"] = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };
  res["body"] = JSON.stringify(userDataInfo);

  return res;
};
