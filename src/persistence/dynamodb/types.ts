import { DynamoDB } from "aws-sdk";
import { Connection, Subscription } from './model';
import { DataMapper } from '@aws/dynamodb-data-mapper';

export type PersistenceArgs = {
  /** A DynamoDB instance from aws-sdk. */
  dynamodb: DynamoDB;
  /** Overrides for default DynamoDB table. */
  tableNames?: Partial<TableNames>;
  /** Number of minutes to append for TTL value */
  ttl?: number;
}

export type PersistenceState = {
  docClient: DynamoDB.DocumentClient;
  dynamodb: DynamoDB;
  ttl: number;
  mapper: DataMapper;
  model: {
   Connection: typeof Connection,
   TopicSubscription: typeof Subscription,
  }
};

export type TableNames = {
  connections: string;
  topicSubscriptions: string;
};

export type DynamoDBConnection = {
  id: string;
  payload: Record<string, string>;
  createdAt: string;
  ttl: string;
}