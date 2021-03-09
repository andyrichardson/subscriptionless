## About

**WIP:** A library for using GraphQL subscriptions with AWS Lambda

## Setup

#### Create a server instance.

```ts
import { createServer } from 'subscriptionless';

const server = createServer({
  dynamodb,
  schema,
});
```

#### Export the handler.

```ts
export const handler = server.handler;
```

#### Configure API Gateway

Set up API Gateway to route websocket events to the exported handler.

Here is a simple serverless framework example.

```yaml
functions:
  websocket:
    name: my-subscription-lambda
    handler: ./handler.handler
    events:
      - websocket:
          route: $connect
      - websocket:
          route: $disconnect
      - websocket:
          route: $default
```

#### Create DynanmoDB tables for state

In-flight connections and subscriptions need to be persisted

Here is a simple serverless framework example.

```yaml
resources:
  Resources:
    # Table for tracking connections
    connectionsTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: connectionsTable
        AttributeDefinitions:
          - AttributeName: id
            AttributeType: S
        KeySchema:
          - AttributeName: id
            KeyType: HASH
        ProvisionedThroughput:
          ReadCapacityUnits: 1
          WriteCapacityUnits: 1
    # Table for tracking subscriptions
    subscriptionsTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: subscriptionsTable
        AttributeDefinitions:
          - AttributeName: id
            AttributeType: S
          - AttributeName: topic
            AttributeType: S
        KeySchema:
          - AttributeName: id
            KeyType: HASH
          - AttributeName: topic
            KeyType: RANGE
        ProvisionedThroughput:
          ReadCapacityUnits: 1
          WriteCapacityUnits: 1
        # TODO: Add GSI definitions for subscriptions

```

## Schema

### PubSub

#### Subscribing to events

Subscribing to messages is similar to the `PubSub` library.

```ts
import { subscribe } from 'subscriptionless/subscribe';

export const resolver = {
  Subscribe: {
    mySubscription: {
      resolve: (event, args, context) => {/* ... */}
      subscribe: subscribe('MY_TOPIC'),
    }
  }
}
```

#### Filtering events

The filter object/function must always resolve to a serializable object.

```ts
import { withFilter, subscribe } from "subscriptionless/subscribe";

// Query agnostic filter
withFilter(subscribe("MY_TOPIC"), {
  attr1: "`attr1` must have this value",
  attr2: {
    attr3: "Nested attributes work fine",
  },
});

// Query agnostic filter
withFilter(subscribe("MY_TOPIC"), (root, args, context, info) => ({
  userId: args.userId,
}));
```

#### Concatenating subscriptions

```tsx
import { concat, subscribe } from "subscriptionless/subscribe";

// Query agnostic filter
concat(subscribe("TOPIC_1"), subscribe("TOPIC_2"));
```

### Subscription side-effects

Event handlers for subscription start/stop can be provided.

#### Enabling side effects

For `onStart` and `onStop` side effects to work, resolvers must be passed to `prepareResolvers`

```ts
import { prepareResolvers } from "subscriptionless/subscribe";

const schema = makeExecutableSchema({
  typedefs,
  resolvers: prepareResolvers(resolvers),
});
```

#### Adding handlers

```ts
export const resolver = {
  Subscribe: {
    mySubscription: {
      resolve: (event, args, context) => {/* ... */}
      subscribe: subscribe('MY_TOPIC'),
      onStart: (root, args) => {/* ... */},
      onStop: (root, args) => {/* ... */}
    }
  }
}
```

## Publishing events

Use the `publish` function to publish events to active subscriptions.

```tsx
server.publish({
  type: "MY_TOPIC",
  payload: "HELLO",
});
```

Events can come from many sources

```tsx
// SNS Event
export const SNSHandler = (event) =>
  Promise.all(
    event.Records.map((r) =>
      server.publish({
        type: r.Sns.subject,
        payload: r.Sns.message,
      })
    )
  );

// Manual Invocation
export const invocationHandler = (payload) =>
  server.publish({ type: "MY_TOPIC", payload });
```

## Client

### Events

#### Connect (onConnect)

Called when a websocket connection is first established.

```ts
const server = createServer({
  /* ... */
  onConnect: ({ event }) => {/* */},
});
```

#### Disconnect (onDisconnect)

Called when a websocket connection is disconnected.

```ts
const server = createServer({
  /* ... */
  onDisconnect: ({ event }) => {/* */},
});
```

#### Authorization (connection_init)

`onConnectionInit` can be used to verify the `connection_init` payload prior to persistence.

> **Note:** Any sensitive data in the incoming message should be removed at this stage.

```ts
const server = createServer({
  /* ... */
  onConnectionInit: ({ message }) => {
    const token = message.payload.token;

    if (!myValidation(token)) {
      throw Error("Token validation failed");
    }

    // Prevent sensitive data from being written to DB
    return {
      ...message.payload,
      token: undefined,
    };
  },
});
```

#### Subscribe (onSubscribe)

Called when any subscription message is received.

```ts
const server = createServer({
  /* ... */
  onSubscribe: ({ event, message }) => {/* */},
});
```


#### Complete (onComplete)

Called when any complete message is received.

```ts
const server = createServer({
  /* ... */
  onComplete: ({ event, message }) => {/* */},
});
```

#### Error (onError)

Called when any error is encountered

```ts
const server = createServer({
  /* ... */
  onError: (error, context) => {/* */},
});
```
