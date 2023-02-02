# AWS Nodejs-based Voucher Redemption Function

## Introduction:

This project aims to build an AWS Nodejs-based function that can redeem voucher keys stored in DynamoDB. The function should be triggered by an API call and the redeeming code will be passed as an argument.

## Purpose:
The purpose of this project is to automate the voucher redemption process and store the redeemed voucher keys in DynamoDB. The function will check if the redeeming code is correct and redeem the voucher if it is. If the redeeming code is incorrect, the function should indicate it in the response as a redeemed code.

## Requirements:

AWS Nodejs Lambda function
AWS API Gateway
DynamoDB database
Functionality:

 - The function will receive a redeeming code as an argument through an API call.
 - The function will query the DynamoDB database to check if the redeeming code exists.
 - If the redeeming code exists, the function will redeem the voucher and update the status of the voucher in the DynamoDB database.
 - If the redeeming code does not exist, the function will return a response indicating that the redeeming code is incorrect.
 - If the redeeming code has already been redeemed, the function will return a response indicating that the code has already been redeemed.


## Implementation:

Set up an AWS Lambda function using Nodejs.
Connect the Lambda function to an AWS API Gateway.
Create a DynamoDB database to store the voucher keys.
Write the code to query the DynamoDB database and redeem the voucher if the redeeming code is correct.
Test the function using sample redeeming codes to ensure that it returns the correct response.
