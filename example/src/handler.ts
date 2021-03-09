import { makeExecutableSchema } from '@graphql-tools/schema';
import { createServer, prepareResolvers } from 'subscriptionless';
import { ApiGatewayManagementApi, DynamoDB } from 'aws-sdk';
import { typeDefs, resolvers } from './schema';

const schema = makeExecutableSchema({
  typeDefs,
  resolvers: prepareResolvers(resolvers),
});

const subscriptionless = createServer({
  dynamodb: new DynamoDB({
    logger: console,
  }),
  schema,
  tableNames: {
    connections: process.env.CONNECTIONS_TABLE,
    subscriptions: process.env.SUBSCRIPTIONS_TABLE
  },
  onConnect: () => console.log("CONNECT"),
  onConnectionInit: () => {console.log('CONNECTION INIT'); return {} },
  onError: console.log,
});

export const wsHandler = subscriptionless.handler;
