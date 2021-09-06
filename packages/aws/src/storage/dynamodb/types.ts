import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export type DynamodbSchemaState = {
  client: DynamoDBDocumentClient;
  tableNames: {
    connections: string;
    subscriptions: string;
    topicSubscriptions: string;
  };
};

export type Resolver<T = {}, A = {}> = (
  args: DynamodbSchemaState
) => (root: T, args: A) => any;

export type DynmaoDBSchemaArgs = {
  client?: DynamoDBClient;
  tableNames?: Partial<DynamodbSchemaState>;
};
