import { ConnectionInitMessage, SubscribeMessage, CompleteMessage } from 'graphql-ws';
import { DataMapper } from '@aws/dynamodb-data-mapper';
import { APIGatewayEvent } from 'aws-lambda';
import { ApiGatewayManagementApi } from 'aws-sdk'
import { GraphQLSchema } from 'graphql';
import { DynamoDB } from 'aws-sdk';

export type ServerArgs = {
  schema: GraphQLSchema;
  dynamodb: DynamoDB;
  gateway: ApiGatewayManagementApi | ((event: APIGatewayEvent) => ApiGatewayManagementApi);
  onConnect: (e: { event: APIGatewayEvent }) => MaybePromise<void>;
  onDisconnect: (e: { event: APIGatewayEvent }) => MaybePromise<void>;
  /* Takes connection_init event and returns payload to be persisted (may include auth steps) */
  onConnectionInit: (e: { event: APIGatewayEvent, message: ConnectionInitMessage }) => MaybePromise<object>;
  onSubscribe: (e: { event: APIGatewayEvent, message: SubscribeMessage }) => MaybePromise<void>;
  onComplete: (e: { event: APIGatewayEvent, message: CompleteMessage }) => MaybePromise<void>;
};

type MaybePromise<T> = T | Promise<T>;

export type ServerClosure = {
  mapper: DataMapper;
} & ServerArgs;

export type WebsocketResponse = {
  statusCode: number,
  headers?: Record<string, string>;
  body: string;
}