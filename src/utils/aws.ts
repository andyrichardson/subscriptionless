import { ApiGatewayManagementApi } from 'aws-sdk';
import {
  ConnectionAckMessage,
  NextMessage,
  CompleteMessage,
  ErrorMessage,
  PingMessage,
  PongMessage,
} from 'graphql-ws';
import { ServerClosure, APIGatewayWebSocketRequestContext } from '../types';

export const sendMessage =
  (c: ServerClosure) =>
  async ({
    connectionId: ConnectionId,
    domainName,
    stage,
    message,
  }: {
    message:
      | ConnectionAckMessage
      | NextMessage
      | CompleteMessage
      | ErrorMessage
      | PingMessage
      | PongMessage;
  } & Pick<
    APIGatewayWebSocketRequestContext,
    'connectionId' | 'domainName' | 'stage'
  >): Promise<void> => {
    const api =
      c.apiGatewayManagementApi ??
      new ApiGatewayManagementApi({
        apiVersion: 'latest',
        endpoint: `${domainName}/${stage}`,
      });

    await api
      .postToConnection({
        ConnectionId,
        Data: JSON.stringify(message),
      })
      .promise();
  };

export const deleteConnection =
  (c: ServerClosure) =>
  async ({
    connectionId: ConnectionId,
    domainName,
    stage,
  }: Pick<
    APIGatewayWebSocketRequestContext,
    'connectionId' | 'domainName' | 'stage'
  >): Promise<void> => {
    const api =
      c.apiGatewayManagementApi ??
      new ApiGatewayManagementApi({
        apiVersion: 'latest',
        endpoint: `${domainName}/${stage}`,
      });

    await api.deleteConnection({ ConnectionId }).promise();
  };
