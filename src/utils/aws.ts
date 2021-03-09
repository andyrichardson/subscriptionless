import ApiGatewayManagementApi from "aws-sdk/clients/apigatewaymanagementapi";
import { APIGatewayEventRequestContext } from "aws-lambda";
import {
  ConnectionAckMessage,
  NextMessage,
  CompleteMessage,
  ErrorMessage,
} from "graphql-ws";

export const sendMessage = (
  a: {
    message:
      | ConnectionAckMessage
      | NextMessage
      | CompleteMessage
      | ErrorMessage;
  } & Pick<APIGatewayEventRequestContext, "connectionId" | "domainName">
) =>
  new ApiGatewayManagementApi({
    apiVersion: "latest",
    endpoint: a.domainName,
  })
    .postToConnection({
      ConnectionId: a.connectionId!,
      Data: JSON.stringify(a.message),
    })
    .promise();

export const deleteConnection = (
  a: Pick<APIGatewayEventRequestContext, "connectionId" | "domainName">
) =>
  new ApiGatewayManagementApi({
    apiVersion: "latest",
    endpoint: a.domainName,
  })
    .deleteConnection({ ConnectionId: a.connectionId! })
    .promise();
