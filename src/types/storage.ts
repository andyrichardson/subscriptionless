interface Connection {
  /** Unique identifier for connection. */
  id: string;
  /** Context state (from connection_init) */
  payload: any;
}

interface Subscription {
  /** connectionId|subscriptionId */
  id: string;
  /** Topic subscriptions and filters */
  constraints: {
    topic: string;
    filter: object;
  }[];
}

export type StorageAdapter = {
  putConnection: (arg: Connection) => Promise<void>;
  getConnection: (arg: { id: Connection }) => Promise<Connection>;
  putSubscription: (arg: )
  set: (arg: { id: string }) => any;
  get: (arg: { id: string }) => any;
};

