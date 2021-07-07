import { makeExecutableSchema } from '@graphql-tools/schema';
import { createInstance, prepareResolvers } from 'subscriptionless';
import { DynamoDB } from 'aws-sdk';
import { typeDefs, resolvers } from './schema';

const schema = makeExecutableSchema({
  typeDefs,
  resolvers: prepareResolvers(resolvers),
});

const instance = createInstance({
  dynamodb: new DynamoDB({
    logger: console,
  }),
  pinger: process.env.PING_STATE_MACHINE_ARN,
  tableNames: {
    connections: process.env.CONNECTIONS_TABLE,
    subscriptions: process.env.SUBSCRIPTIONS_TABLE,
  },
  schema,
  onConnectionInit: () => ({}),
  onError: console.error,
  onPing: () => console.log('GOT PING'),
});

export const wsHandler = instance.handler;

export const snsHandler = (event) =>
  Promise.all(
    event.Records.map((r) =>
      instance.publish({
        topic: r.Sns.TopicArn.substring(r.Sns.TopicArn.lastIndexOf(':') + 1), // Get topic name
        payload: JSON.parse(r.Sns.Message),
      })
    )
  );

export const pingHandler = instance.ping;
