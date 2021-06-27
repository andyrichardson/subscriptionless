import { APIGatewayEventRequestContext } from "aws-lambda";

export interface Persistence {
  connection: {
    /** Persist a connection along with the parsed connection_init payload */
    put: (c: Connection) => MaybePromise<void>;
    /** Retrieve a persisted connection by ID */
    get: (query: { id: Connection['id'] }) => MaybePromise<Connection>;
    /** Delete a connection by ID (and any associated subscriptions) */
    delete: (query: { id: Connection['id'] }) => void;
  };
  topicSubscription: {
    /** Persist a subscription for a topic */
    put: (ts: TopicSubscription) => any;
    /** Retrieve a persisted connection by ID */
    get: (query: { id: TopicSubscription['id'] }) => TopicSubscription;
    getMany: (query: {
      topic: TopicSubscription['topic'];
      event: any;
    }) => TopicSubscription[];
    /** Delete a subscription for a topic */
    delete: (query: { id: TopicSubscription['id'] }) => any;
  };
}

export interface Connection {
  id: string;
  requestContext: APIGatewayEventRequestContext;
  payload: Record<string, string>;
}

export interface TopicSubscription {
  /** ID of subscription (declared by client) */
  id: string;
  /** ID of connection that the subscription lives on */
  connectionId: string;
  /** Topic that subscription is associated with  */
  topic: string;
  filter: object;
  subscription: {
    query: string;
    variables?: any;
    variableValues?: any;
    operationName?: string | null;
  };
}

type MaybePromise<T> = T | Promise<T>;
