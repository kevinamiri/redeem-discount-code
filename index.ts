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
  let requestContexts = event.requestContext.authorizer;
  const user = requestContexts.claims.sub;
  const useremail = requestContexts.claims.email;
  let bodyEvent = JSON.parse(event.body);
  const email = useremail;
  const voucher = bodyEvent.voucher;

  /**
   * 1. Check if the user has already redeemed a discount code ProjectionExpression is used to only return the code attribute
   * To read data from a table, you use operations such as GetItem, Query, or Scan.
   *  Amazon DynamoDB returns all the item attributes by default.
   *  To get only some, rather than all of the attributes, use a projection expression.
   */

  // const params = {
  //   TableName: "redeemcodes",
  //   FilterExpression: "voucher = :voucher",
  //   ExpressionAttributeValues: {
  //     ":voucher": voucher,
  //   },
  //   ProjectionExpression: "status, voucher",
  // };

  const paramsData = {
    TableName: "vouchers",
    AttributesToGet: ["voucher", "status"],
    Key: {
      voucher: voucher,
    },
  };

  const data = await getItem(paramsData);

  let { Item } = data;

  const redeemStatus = Item && Item.status;

  console.log(data);
  let userDataInfo = { ...Item };
  userDataInfo["statusVoucher"] = voucher;
  userDataInfo["email"] = email;

  /*
1. Where the key is voucher and redeemStatus is "redeemable", update the status to "redeemed".
2. Add a new column as email which is email value of the user.
*/

  if (redeemStatus === "redeemable") {
    const params = {
      TableName: "vouchers",
      Key: {
        voucher: voucher,
      },
      UpdateExpression: "set #status = :status, #email = :email",
      ExpressionAttributeNames: {
        "#status": "status",
        "#email": "email",
      },
      ExpressionAttributeValues: {
        ":status": "redeemed",
        ":email": email,
      },
      ReturnValues: "UPDATED_NEW",
    };

    try {
      const data = await docClient.update(params).promise();
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Voucher redeemed successfully",
        }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Voucher not redeemed",
        }),
      };
    }
  } else {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Voucher not redeemable",
      }),
    };
  }
};
