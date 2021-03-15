import { makeExecutableSchema } from "@graphql-tools/schema";
import { createInstance, prepareResolvers } from "subscriptionless";
import { DynamoDB } from "aws-sdk";
import { typeDefs, resolvers } from "./schema";

const schema = makeExecutableSchema({
  typeDefs,
  resolvers: prepareResolvers(resolvers),
});

const instance = createInstance({
  dynamodb: new DynamoDB({
    logger: console,
  }),
  schema,
  tableNames: {
    connections: process.env.CONNECTIONS_TABLE,
    subscriptions: process.env.SUBSCRIPTIONS_TABLE,
  },
  onSubscribe: (...args) => {
    console.log("SUBSCRIBE");
    console.log(JSON.stringify(args, null, 2));
  },
  onConnect: () => console.log("CONNECT"),
  onConnectionInit: () => {
    console.log("CONNECTION INIT");
    return {};
  },
  onError: console.log,
});

export const wsHandler = instance.handler;

export const snsHandler = (event) =>
  Promise.all(
    event.Records.map((r) =>
      instance.publish({
        topic: r.Sns.TopicArn.substring(r.Sns.TopicArn.lastIndexOf(":") + 1), // Get topic name
        payload: JSON.parse(r.Sns.Message),
      })
    )
  );
