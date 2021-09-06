import { DeleteCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { addHours, getUnixTime } from '../../util';
import { Resolver } from './types';

export const createConnection: Resolver = (c) => (_, args) => {
  const now = new Date();

  return c.client
    .send(
      new PutCommand({
        TableName: c.tableNames.connections,
        Item: {
          ...args,
          createdAt: getUnixTime(now),
          ttl: getUnixTime(addHours(now, 2)),
        },
      })
    )
    .then(() => true);
};

export const deleteConnection: Resolver = (c) => (_, args) =>
  c.client
    .send(
      new DeleteCommand({
        TableName: c.tableNames.connections,
        Key: args,
      })
    )
    .then(() => true);

export const createSubscription: Resolver = (c) => (_, args) => {
  const now = new Date();

  return c.client
    .send(
      new PutCommand({
        TableName: c.tableNames.subscriptions,
        Item: {
          ...args,
          createdAt: getUnixTime(now),
          ttl: getUnixTime(addHours(now, 2)),
        },
      })
    )
    .then(() => true);
};

export const deleteSubscription: Resolver = (c) => (_, args) =>
  c.client
    .send(
      new DeleteCommand({
        TableName: c.tableNames.subscriptions,
        Key: args,
      })
    )
    .then(() => true);

export const createTopicSubscription: Resolver = (c) => (_, args) => {
  const now = new Date();

  return c.client
    .send(
      new PutCommand({
        TableName: c.tableNames.topicSubscriptions,
        Item: {
          ...args,
          createdAt: getUnixTime(now),
          ttl: getUnixTime(addHours(now, 2)),
        },
      })
    )
    .then(() => true);
};

export const deleteTopicSubscription: Resolver = (c) => (_, args) =>
  c.client
    .send(
      new DeleteCommand({
        TableName: c.tableNames.topicSubscriptions,
        Key: args,
      })
    )
    .then(() => true);
