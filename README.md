## About

GraphQL subscriptions for AWS Lambda and API Gateway WebSockets.

Have all the functionality of GraphQL subscriptions on a stateful server without the cost.

> Note: This project uses the [graphql-ws protocol](https://github.com/enisdenjo/graphql-ws) under the hood.

## ⚠️ Limitations

Seriously, **read this first** before you even think about using this.

<details>
  
<summary>This is in alpha</summary>

This is Alpha software and should be treated as such.

</details>

<details>
  
<summary>AWS API Gateway Limitations</summary>

There are a few noteworthy limitations to the AWS API Gateway WebSocket implementation.

> Note: If you work on AWS and want to run through this, hit me up!

#### Ping/Pong

For whatever reason, AWS API Gateway does not support WebSocket protocol level ping/pong.

This means early detection of unclean client disconnects is near impossible [(graphql-ws will not implement subprotocol level ping/pong)](https://github.com/enisdenjo/graphql-ws/issues/117).

#### Socket idleness

API Gateway considers an idle connection to be one where no messages have been sent on the socket for a fixed duration [(currently 10 minutes)](https://docs.aws.amazon.com/apigateway/latest/developerguide/limits.html#apigateway-execution-service-websocket-limits-table).

Again, the WebSocket spec has support for detecting idle connections (ping/pong) but API Gateway doesn't use it. This means, in the case where both parties are connected, and no message is sent on the socket for the defined duration (direction agnostic), API Gateway will close the socket.

A quick fix for this is to set up immediate reconnection on the client side.

#### Socket errors

API Gateway's current socket closing functionality doesn't support any kind of message/payload. Along with this, [graphql-ws won't support error messages](https://github.com/enisdenjo/graphql-ws/issues/112).

Because of this limitation, there is no clear way to communicate subprotocol errors to the client. In the case of a subprotocol error the socket will be closed by the server (with no meaningful disconnect payload).

</details>

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

Set up API Gateway to route WebSocket events to the exported handler.

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

</details>

#### Create DynanmoDB tables for state

In-flight connections and subscriptions need to be persisted.

<details>
  
<summary>📖  Changing DynamoDB table names</summary>

Use the `tableNames` argument to override the default table names.

```ts
const instance = createInstance({
  /* ... */
  tableNames: {
    connections: "my_connections",
    subscriptions: "my_subscriptions",
  },
});
```

</details>

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

### Context

Context values are accessible in all resolver level functions (`resolve`, `subscribe`, `onSubscribe` and `onComplete`).

<details>
  
<summary>📖 Default value</summary>

Assuming no `context` argument is provided, the default value is an object containing a `connectionParams` attribute.

This attribute contains the [(optionally parsed)](#events) payload from `connection_init`.

```ts
export const resolver = {
  Subscribe: {
    mySubscription: {
      resolve: (event, args, context) => {
        console.log(context.connectionParams); // payload from connection_init
      },
    },
  },
};
```

</details>

<details>
  
<summary>📖 Setting static context value</summary>

An object can be provided via the `context` attribute when calling `createInstance`.

```ts
const instance = createInstance({
  /* ... */
  context: {
    myAttr: "hello",
  },
});
```

The default values (above) will be appended to this object prior to execution.

</details>

<details>
  
<summary>📖 Setting dynamic context value</summary>

A function (optionally async) can be provided via the `context` attribute when calling `createInstance`.

The default context value is passed as an argument.

```ts
const instance = createInstance({
  /* ... */
  context: ({ connectionParams }) => ({
    myAttr: "hello",
    user: connectionParams.user,
  }),
});
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

Called when a WebSocket connection is first established.

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

Called when a WebSocket connection is disconnected.

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

By default, the (optionally parsed) payload will be accessible via [context](#context).

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
