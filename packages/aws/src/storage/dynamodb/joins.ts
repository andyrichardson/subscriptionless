import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Resolver } from './types';

export const connectionSubscription: Resolver<{ id: string }> =
  (c) =>
  ({ id }) => {
    return c.client
      .send(
        new QueryCommand({
          TableName: c.tableNames.subscriptions,
          KeyConditionExpression: 'begins_with(id, :id)',
          ExpressionAttributeValues: {
            ':id': id,
          },
        })
      )
      .then(() => true);
  };
