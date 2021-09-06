import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from '@subscriptionless/core';
import { DynmaoDBSchemaArgs } from './types';
import * as M from './mutations';
import * as Q from './queries';
import * as J from './joins';

export const dynamodbSchema = (args: DynmaoDBSchemaArgs) => {
  const state = {
    client: DynamoDBDocumentClient.from(args.client || new DynamoDBClient({})),
    tableNames: {
      connections: 'connections',
      subscriptions: 'subscriptions',
      topicSubscriptions: 'topicSubscriptions',
      ...args.tableNames,
    },
  };

  return makeExecutableSchema({
    typeDefs,
    resolvers: {
      Connection: {
        subscriptions: J.connectionSubscription(state),
      },
      Query: {
        getConnection: Q.getConnection(state),
        getSubscription: Q.getSubscription(state),
      },
      Mutation: {
        createConnection: M.createConnection(state),
        deleteConnection: M.deleteConnection(state),
        createSubscription: M.createSubscription(state),
        deleteSubscription: M.deleteSubscription(state),
        createTopicSubscription: M.createTopicSubscription(state),
        deleteTopicSubscription: M.deleteTopicSubscription(state),
      },
    },
  });
};
