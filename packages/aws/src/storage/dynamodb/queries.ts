import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { Resolver } from './types';

export const getConnection: Resolver<{}, { id: string }> =
  (c) =>
  (_, { id }) =>
    c.client
      .send(
        new GetCommand({
          TableName: c.tableNames.connections,
          Key: { id },
        })
      )
      .then((r) => r.Item);

export const getSubscription: Resolver<{}, { id: string }> =
  (c) =>
  (_, { id }) =>
    c.client
      .send(
        new GetCommand({
          TableName: c.tableNames.subscriptions,
          Key: { id },
        })
      )
      .then((r) => r.Item);
