import { ConnectionInitMessage, SubscribeMessage, CompleteMessage } from 'graphql-ws';
import { DataMapper } from '@aws/dynamodb-data-mapper';
import { APIGatewayEvent } from 'aws-lambda';
import { GraphQLSchema } from 'graphql';
import DynamoDB from 'aws-sdk/clients/dynamodb';
import { Subscription, Connection } from './model';

export type ServerArgs = {
  schema: GraphQLSchema;
  dynamodb: DynamoDB;
  tableNames?: Partial<TableNames>;
  onConnect?: (e: { event: APIGatewayEvent }) => MaybePromise<void>;
  onDisconnect?: (e: { event: APIGatewayEvent }) => MaybePromise<void>;
  /* Takes connection_init event and returns payload to be persisted (may include auth steps) */
  onConnectionInit?: (e: { event: APIGatewayEvent, message: ConnectionInitMessage }) => MaybePromise<object>;
  onSubscribe?: (e: { event: APIGatewayEvent, message: SubscribeMessage }) => MaybePromise<void>;
  onComplete?: (e: { event: APIGatewayEvent, message: CompleteMessage }) => MaybePromise<void>;
  onError?: (error: any, context: any) => void;
};

type MaybePromise<T> = T | Promise<T>;

export type ServerClosure = {
  mapper: DataMapper;
  model: {
    Subscription: typeof Subscription;
    Connection: typeof Connection;
  }
} & Omit<ServerArgs, 'tableNames'>;

type TableNames = {
  connections: string;
  subscriptions: string;
}

export type WebsocketResponse = {
  statusCode: number,
  headers?: Record<string, string>;
  body: string;
}

export type SubscriptionDefinition = {
  topic: string;
  filter?: object | (() => void);
};

export type SubscribeHandler = (...args: any[]) => SubscribePsuedoIterable;

export type SubscribePsuedoIterable = {
  (): void;
  definitions: SubscriptionDefinition[];
};

export type SubscribeArgs = any[];

export type Class = { new(...args: any[]): any; };