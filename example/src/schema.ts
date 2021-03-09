import { subscribe } from 'subscriptionless';
import gql from 'graphql-tag';

export const typeDefs = gql`
  type Article {
    id: ID!
    title: String!
    content: String!
  }

  type Query {
    articles: [Article!]!
  }

  type Mutation {
    publishArticle(title: String!, content: String!): Article!
  }

  type Subscription {
    newArticles: [Article!]!
  }
`;

export const resolvers = {
  Query: {
    articles: () => []
  },
  Mutation: {
    publishArticle: () => ({})
  },
  Subscription: {
    newArticles: {
      resolve: (event, args) => event.payload,
      subscribe: subscribe('NEW_ARTICLE'),
      onStart: () => console.log("START!"),
      onStop: () => console.log("STOP!"),
    }
  }
}