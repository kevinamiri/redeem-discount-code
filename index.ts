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
export const createItem = async function (n) {
  try {
    await docClient.put(n).promise();
  } catch (err) {
    return err;
  }
};

export const handler: Handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResultV2> => {
  let requestContexts = event.requestContext.authorizer;
  const user = requestContexts.claims.sub;
  const useremail = requestContexts.claims.email;
  let bodyEvent = JSON.parse(event.body);
  const email = useremail;
  const voucher = bodyEvent.voucher;
  const DateNumNow = Date.now();
  const hoursNumber = Number(DateNumNow) / 3600000; // 1 hour = 3600000 milliseconds >> which is the record of the last 1 hour
  const minutesNumber = Number(DateNumNow) / 60000; // 1 minute = 60000 milliseconds
  const monthsNumber = Number(DateNumNow) / 2629746000; // 2629746000 is the number of milliseconds in a month; This will record the last month number
  const hoursNumFixed = hoursNumber.toFixed(0);
  const minutesNumFixed = minutesNumber.toFixed(0);
  const monthsNumFixed = monthsNumber.toFixed(0);

  //1- create tables if user did not existed
  const paramsStart = {
    TableName: "users",
    Item: {
      id: useremail,
      userType: 1,
      generationDate: DateNumNow,
      hoursNumber: hoursNumFixed,
      minuteNumber: minutesNumFixed,
      monthsNumber: monthsNumFixed,
      characters: 0,
      tokenUsage: 0,
      points: 0,
      runs: 0,
      runsInHours: 0,
      runsInMinutes: 0,
      charsInMonths: 0,
      permission: "free",
    },
    ConditionExpression: "attribute_not_exists(id)",
  };

  //apply 1
  await createItem(paramsStart);

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

    // update users table and add a column called permission with value of "premium" and userType with value of 3
    const paramsUsers = {
      TableName: "users",
      Key: {
        id: useremail,
      },
      UpdateExpression: "set #permission = :permission, #userType = :userType",
      ExpressionAttributeNames: {
        "#permission": "permission",
        "#userType": "userType",
      },
      ExpressionAttributeValues: {
        ":permission": "premium",
        ":userType": 3,
      },
      ReturnValues: "UPDATED_NEW",
    };

    try {
      const updateData = await docClient.update(params).promise();
      await docClient.update(paramsUsers).promise();
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "The discount code has been redeemed successfully",
          data: userDataInfo,
          updateData,
        }),
      };
    } catch (err) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Erorr while fetching data, please try again or contact us",
        }),
      };
    }
  } else {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message:
          "The discount coupon cannot be redeemed, this means that the coupon has already been redeemed or has expired.",
      }),
    };
  }
};
