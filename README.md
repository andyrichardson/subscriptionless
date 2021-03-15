## About

**WIP:** A library for using GraphQL subscriptions with AWS Lambda using the [graphql-ws protocol](https://github.com/enisdenjo/graphql-ws)

## Setup

#### Create a subscriptionless instance.

```ts
import { createInstance } from 'subscriptionless';

const instance = createInstance({
  dynamodb,
  schema,
});
```

#### Export the handler.

```ts
export const handler = instance.handler;
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

<details>
  
<summary>Here is a serverless framework example.</summary>

```yaml
resources:
  Resources:
    # Table for tracking connections
    connectionsTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:provider.environment.CONNECTIONS_TABLE}
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
        TableName: ${self:provider.environment.SUBSCRIPTIONS_TABLE}
        AttributeDefinitions:
          - AttributeName: id
            AttributeType: S
          - AttributeName: topic
            AttributeType: S
          - AttributeName: connectionId
            AttributeType: S
        KeySchema:
          - AttributeName: id
            KeyType: HASH
          - AttributeName: topic
            KeyType: RANGE
        GlobalSecondaryIndexes:
          - IndexName: ConnectionIndex
            KeySchema:
              - AttributeName: connectionId
                KeyType: HASH
            Projection:
              ProjectionType: ALL
            ProvisionedThroughput:
              ReadCapacityUnits: 1
              WriteCapacityUnits: 1
          - IndexName: TopicIndex
            KeySchema:
              - AttributeName: topic
                KeyType: HASH
            Projection:
              ProjectionType: ALL
            ProvisionedThroughput:
              ReadCapacityUnits: 1
              WriteCapacityUnits: 1
        ProvisionedThroughput:
          ReadCapacityUnits: 1
          WriteCapacityUnits: 1

```

</details>

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

// Subscription agnostic filter
withFilter(subscribe("MY_TOPIC"), {
  attr1: "`attr1` must have this value",
  attr2: {
    attr3: "Nested attributes work fine",
  },
});

// Subscription specific filter
withFilter(subscribe("MY_TOPIC"), (root, args, context, info) => ({
  userId: args.userId,
}));
```

#### Concatenating subscriptions

```tsx
import { concat, subscribe } from "subscriptionless/subscribe";

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
instance.publish({
  type: "MY_TOPIC",
  payload: "HELLO",
});
```

Events can come from many sources

```tsx
// SNS Event
export const snsHandler = (event) =>
  Promise.all(
    event.Records.map((r) =>
      instance.publish({
        topic: r.Sns.TopicArn.substring(r.Sns.TopicArn.lastIndexOf(":") + 1), // Get topic name (e.g. "MY_TOPIC")
        payload: JSON.parse(r.Sns.Message),
      })
    )
  );

// Manual Invocation
export const invocationHandler = (payload) =>
  instance.publish({ topic: "MY_TOPIC", payload });
```

## Client

### Events

#### Connect (onConnect)

Called when a websocket connection is first established.

```ts
const instance = createInstance({
  /* ... */
  onConnect: ({ event }) => {/* */},
});
```

#### Disconnect (onDisconnect)

Called when a websocket connection is disconnected.

```ts
const instance = createInstance({
  /* ... */
  onDisconnect: ({ event }) => {/* */},
});
```

#### Authorization (connection_init)

`onConnectionInit` can be used to verify the `connection_init` payload prior to persistence.

> **Note:** Any sensitive data in the incoming message should be removed at this stage.

```ts
const instance = createInstance({
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
const instance = createInstance({
  /* ... */
  onSubscribe: ({ event, message }) => {/* */},
});
```


#### Complete (onComplete)

Called when any complete message is received.

```ts
const instance = createInstance({
  /* ... */
  onComplete: ({ event, message }) => {/* */},
});
```

#### Error (onError)

Called when any error is encountered

```ts
const instance = createInstance({
  /* ... */
  onError: (error, context) => {/* */},
});
```
