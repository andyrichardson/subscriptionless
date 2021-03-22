import { ApiGatewayManagementApi } from 'aws-sdk';
import { APIGatewayEventRequestContext } from 'aws-lambda';
import {
  ConnectionAckMessage,
  NextMessage,
  CompleteMessage,
  ErrorMessage,
} from 'graphql-ws';

export const sendMessage = (
  a: {
    message:
      | ConnectionAckMessage
      | NextMessage
      | CompleteMessage
      | ErrorMessage;
  } & Pick<
    APIGatewayEventRequestContext,
    'connectionId' | 'domainName' | 'stage'
  >
) =>
  new ApiGatewayManagementApi({
    apiVersion: 'latest',
    endpoint: `${a.domainName}/${a.stage}`,
  })
    .postToConnection({
      ConnectionId: a.connectionId!,
      Data: JSON.stringify(a.message),
    })
    .promise();

export const deleteConnection = (
  a: Pick<
    APIGatewayEventRequestContext,
    'connectionId' | 'domainName' | 'stage'
  >
) =>
  new ApiGatewayManagementApi({
    apiVersion: 'latest',
    endpoint: `${a.domainName}/${a.stage}`,
  })
    .deleteConnection({ ConnectionId: a.connectionId! })
    .promise();
