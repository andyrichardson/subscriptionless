import { ApiGatewayManagementApi } from 'aws-sdk';
import {
  ConnectionAckMessage,
  NextMessage,
  CompleteMessage,
  ErrorMessage,
  PingMessage,
  PongMessage,
} from 'graphql-ws';
import { ServerClosure, APIGatewayWebSocketEvent } from '../types';

export const sendMessage = async (
  c : ServerClosure,
  {
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
  APIGatewayWebSocketEvent['requestContext'],
    'connectionId' | 'domainName' | 'stage'
  >
): Promise<void> => {
  const api = c.apiGatewayManagementApi ?? new ApiGatewayManagementApi({
    apiVersion: 'latest',
    endpoint: `${domainName}/${stage}`,
  })

  await api.postToConnection({
    ConnectionId,
    Data: JSON.stringify(message),
  })
  .promise();
}

export const deleteConnection = async (
  c : ServerClosure,
  {
    connectionId: ConnectionId,
    domainName,
    stage
  }: {
    connectionId: string;
    domainName: string;
    stage: string;
  }
): Promise<void> => {
  const api = c.apiGatewayManagementApi ?? new ApiGatewayManagementApi({
    apiVersion: 'latest',
    endpoint: `${domainName}/${stage}`,
  })

  await api.deleteConnection({ ConnectionId })
    .promise();
}
