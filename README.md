## About

GraphQL subscriptions for AWS Lambda and API Gateway Websockets.

Have all the functionality of GraphQL subscriptions on a stateful server without the cost.

> Note: This project uses the [graphql-ws protocol](https://github.com/enisdenjo/graphql-ws) under the hood.

## Setup

#### Create a subscriptionless instance.

```ts
import { createInstance } from "subscriptionless";

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

_Serverless framework example._

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
  
<summary>💾 serverless framework example</summary>

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

<details>
  
<summary>💾 terraform example</summary>

```tf
resource "aws_dynamodb_table" "connections-table" {
  name           = "subscriptionless_connections"
  billing_mode   = "PROVISIONED"
  read_capacity  = 1
  write_capacity = 1
  hash_key = "id"

  attribute {
    name = "id"
    type = "S"
  }
}

resource "aws_dynamodb_table" "subscriptions-table" {
  name           = "subscriptionless_subscriptions"
  billing_mode   = "PROVISIONED"
  read_capacity  = 1
  write_capacity = 1
  hash_key = "id"
  range_key = "topic"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "topic"
    type = "S"
  }

  attribute {
    name = "connectionId"
    type = "S"
  }

  global_secondary_index {
    name               = "ConnectionIndex"
    hash_key           = "connectionId"
    write_capacity     = 1
    read_capacity      = 1
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "TopicIndex"
    hash_key           = "topic"
    write_capacity     = 1
    read_capacity      = 1
    projection_type    = "ALL"
  }
}
```

</details>

## Usage

### PubSub

`subscriptionless` uses it's own _PubSub_ implementation which loosely implements the [Apollo PubSub Interface](https://github.com/apollographql/graphql-subscriptions#pubsub-implementations).

> Note: Unlike the Apollo `PubSub` library, this implementation is (mostly) stateless

<details>
  
<summary>📖 Subscribing to topics</summary>

Use the `subscribe` function to associate incoming subscriptions with a topic.

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

</details>

<details>
  
<summary>📖 Filtering events</summary>

Wrap any `subscribe` function call in a `withFilter` to provide filter conditions.

> Note: If a function is provided, it will be called **on subscription start** and must return a serializable object.

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

</details>

<details>
  
<summary>📖 Concatenating topic subscriptions</summary>

Join multiple topic subscriptions together using `concat`.

```tsx
import { concat, subscribe } from "subscriptionless/subscribe";

concat(subscribe("TOPIC_1"), subscribe("TOPIC_2"));
```

</details>

<details>
  
<summary>📖 Publishing events</summary>

Use the `publish` on your subscriptionless instance to publish events to active subscriptions.

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

</details>

### Side effects

Side effect handlers can be declared on subscription fields to handle `onSubscribe` (start) and `onComplete` (stop) events.

<details>
  
<summary>📖 Enabling side effects</summary>

For `onSubscribe` and `onComplete` side effects to work, resolvers must first be passed to `prepareResolvers` prior to schema construction.

```ts
import { prepareResolvers } from "subscriptionless/subscribe";

const schema = makeExecutableSchema({
  typedefs,
  resolvers: prepareResolvers(resolvers),
});
```

</details>

<details>
  
<summary>📖 Adding side-effect handlers</summary>

```ts
export const resolver = {
  Subscribe: {
    mySubscription: {
      resolve: (event, args, context) => {
        /* ... */
      },
      subscribe: subscribe("MY_TOPIC"),
      onSubscribe: (root, args) => {
        /* Do something on subscription start */
      },
      onComplete: (root, args) => {
        /* Do something on subscription stop */
      },
    },
  },
};
```

</details>

### Events

Global events can be provided when calling `createInstance` to track the execution cycle of the lambda.

<details>
  
<summary>📖 Connect (onConnect)</summary>

Called when a websocket connection is first established.

```ts
const instance = createInstance({
  /* ... */
  onConnect: ({ event }) => {
    /* */
  },
});
```

</details>

<details>
  
<summary>📖 Disconnect (onDisconnect)</summary>

Called when a websocket connection is disconnected.

```ts
const instance = createInstance({
  /* ... */
  onDisconnect: ({ event }) => {
    /* */
  },
});
```

</details>

<details>
  
<summary>📖 Authorization (connection_init)</summary>

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

</details>

<details>
  
<summary>📖 Subscribe (onSubscribe)</summary>

#### Subscribe (onSubscribe)

Called when any subscription message is received.

```ts
const instance = createInstance({
  /* ... */
  onSubscribe: ({ event, message }) => {
    /* */
  },
});
```

</details>

<details>
  
<summary>📖 Complete (onComplete)</summary>

Called when any complete message is received.

```ts
const instance = createInstance({
  /* ... */
  onComplete: ({ event, message }) => {
    /* */
  },
});
```

</details>

<details>
  
<summary>📖 Error (onError)</summary>

Called when any error is encountered

```ts
const instance = createInstance({
  /* ... */
  onError: (error, context) => {
    /* */
  },
});
```

</details>
