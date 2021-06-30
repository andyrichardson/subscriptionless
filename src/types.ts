import {
  ConnectionInitMessage,
  SubscribeMessage,
  CompleteMessage,
  PingMessage,
  PongMessage,
} from 'graphql-ws';
import { DataMapper } from '@aws/dynamodb-data-mapper';
import {
  APIGatewayEventRequestContext,
  APIGatewayProxyEvent,
} from 'aws-lambda';
import { GraphQLSchema } from 'graphql';
import { ApiGatewayManagementApi, DynamoDB, StepFunctions } from 'aws-sdk';
import { Subscription, Connection } from './model';

export type ServerArgs = {
  schema: GraphQLSchema;
  dynamodb: DynamoDB;
  apiGatewayManagementApi?: ApiGatewayManagementApi;
  context?: ((arg: { connectionParams: any }) => object) | object;
  tableNames?: Partial<TableNames>;
  pingpong?: {
    machine: string;
    delay: number;
    timeout: number;
  };
  onConnect?: (e: { event: APIGatewayWebSocketEvent }) => MaybePromise<void>;
  onDisconnect?: (e: { event: APIGatewayWebSocketEvent }) => MaybePromise<void>;
  /* Takes connection_init event and returns payload to be persisted (may include auth steps) */
  onConnectionInit?: (e: {
    event: APIGatewayWebSocketEvent;
    message: ConnectionInitMessage;
  }) => MaybePromise<object>;
  onSubscribe?: (e: {
    event: APIGatewayWebSocketEvent;
    message: SubscribeMessage;
  }) => MaybePromise<void>;
  onComplete?: (e: {
    event: APIGatewayWebSocketEvent;
    message: CompleteMessage;
  }) => MaybePromise<void>;
  onPing?: (e: {
    event: APIGatewayWebSocketEvent;
    message: PingMessage;
  }) => MaybePromise<void>;
  onPong?: (e: {
    event: APIGatewayWebSocketEvent;
    message: PongMessage;
  }) => MaybePromise<void>;
  onError?: (error: any, context: any) => void;
};

type MaybePromise<T> = T | Promise<T>;

export type ServerClosure = {
  mapper: DataMapper;
  model: {
    Subscription: typeof Subscription;
    Connection: typeof Connection;
  };
} & Omit<ServerArgs, 'tableNames'>;

type TableNames = {
  connections: string;
  subscriptions: string;
};

export type WebsocketResponse = {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
};

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

export type Class = { new (...args: any[]): any };

export type StateFunctionInput = {
  connectionId: string;
  domainName: string;
  stage: string;
  state: 'PING' | 'REVIEW' | 'ABORT';
  seconds: number;
};

export interface APIGatewayWebSocketRequestContext extends APIGatewayEventRequestContext {
  connectionId: string
  domainName: string
}

export interface APIGatewayWebSocketEvent extends APIGatewayProxyEvent {
  requestContext: APIGatewayWebSocketRequestContext;
}
