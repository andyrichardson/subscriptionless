import { parse } from 'graphql';

export const typeDefs = parse(`
  scalar Object

  type Connection {
    id: ID!
    payload: Object! # Payload returned from connection_init handler.
    subscriptions: [Subscription!]!
  }

  type Subscription {
    id: ID! # Combination of connection ID and subscription uuid (e.g. 1234#1234)
    uuid: String!
    topics: [TopicSubscription!]!
    connection: Connection!
  }

  type TopicSubscription {
    topic: String!
    filter: Object!
    subscription: Subscription!
  }

  type Query {
    getConnection(id: ID!): Connection!
    getSubscription(id: ID!): Subscription!
  }

  type Mutation {
    createConnection(id: ID!, payload: Object!): Boolean!
    deleteConnection(id: ID!): Boolean!
    createSubscription(id: ID!, payload: Object!): Boolean!
    deleteSubscription(id: ID!): Boolean!
    createTopicSubscription(id: ID!, payload: Object!): Boolean!
    deleteTopicSubscription(id: ID!): Boolean!
  }
`);
