## About

GraphQL subscriptions for AWS Lambda and API Gateway WebSockets.

Have all the functionality of GraphQL subscriptions on a stateful server without the cost.

> Note: This project uses the [graphql-ws protocol](https://github.com/enisdenjo/graphql-ws) under the hood.

## ⚠️ Limitations

Seriously, **read this first** before you even think about using this.

<details>
  
<summary>This is in beta</summary>

This is beta and should be treated as such.

</details>

<details>
  
<summary>AWS API Gateway Limitations</summary>

There are a few noteworthy limitations to the AWS API Gateway WebSocket implementation.

> Note: If you work on AWS and want to run through this, hit me up!

#### Socket timeouts

Default socket idleness [detection in API Gateway is unpredictable](https://github.com/andyrichardson/subscriptionless/issues/3).

It is strongly recommended to use socket idleness detection [listed here](#configure-idleness-detection-pingpong). Alternatively, client->server pinging can be used to keep a connection alive.

#### Socket errors

API Gateway's current socket closing functionality doesn't support any kind of message/payload. Along with this, [graphql-ws won't support error messages](https://github.com/enisdenjo/graphql-ws/issues/112).

Because of this limitation, there is no clear way to communicate subprotocol errors to the client. In the case of a subprotocol error the socket will be closed by the server (with no meaningful disconnect payload).

</details>

## Setup

#### Create a subscriptionless instance.

```ts
import { createInstance } from 'subscriptionless';

const instance = createInstance({
  schema,
});
```

#### Export the handler.

```ts
export const gatewayHandler = instance.gatewayHandler;
```

#### Configure API Gateway

Set up API Gateway to route WebSocket events to the exported handler.

<details>
  <summary>💾 serverless framework example</summary>

```yaml
functions:
  websocket:
    name: my-subscription-lambda
    handler: ./handler.gatewayHandler
    events:
      - websocket:
          route: $connect
      - websocket:
          route: $disconnect
      - websocket:
          route: $default
```

</details>

<details>
  <summary>💾 terraform example</summary>

```tf
resource "aws_apigatewayv2_api" "ws" {
  name                       = "websocket-api"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}

resource "aws_apigatewayv2_route" "default_route" {
  api_id    = aws_apigatewayv2_api.ws.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.default_integration.id}"
}

resource "aws_apigatewayv2_route" "connect_route" {
  api_id    = aws_apigatewayv2_api.ws.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.default_integration.id}"
}

resource "aws_apigatewayv2_route" "disconnect_route" {
  api_id    = aws_apigatewayv2_api.ws.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.default_integration.id}"
}

resource "aws_apigatewayv2_integration" "default_integration" {
  api_id           = aws_apigatewayv2_api.ws.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.gateway_handler.invoke_arn
}

resource "aws_lambda_permission" "apigateway_invoke_lambda" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.gateway_handler.function_name
  principal     = "apigateway.amazonaws.com"
}

resource "aws_apigatewayv2_deployment" "ws" {
  api_id = aws_apigatewayv2_api.ws.id

  triggers = {
    redeployment = sha1(join(",", tolist([
      jsonencode(aws_apigatewayv2_integration.default_integration),
      jsonencode(aws_apigatewayv2_route.default_route),
      jsonencode(aws_apigatewayv2_route.connect_route),
      jsonencode(aws_apigatewayv2_route.disconnect_route),
    ])))
  }

  depends_on = [
    aws_apigatewayv2_route.default_route,
    aws_apigatewayv2_route.connect_route,
    aws_apigatewayv2_route.disconnect_route
  ]
}

resource "aws_apigatewayv2_stage" "ws" {
  api_id        = aws_apigatewayv2_api.ws.id
  name          = "example"
  deployment_id = aws_apigatewayv2_deployment.ws.id
}
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
    connections: 'my_connections',
    subscriptions: 'my_subscriptions',
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
        TimeToLiveSpecification:
          AttributeName: ttl
          Enabled: true
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
        TimeToLiveSpecification:
          AttributeName: ttl
          Enabled: true
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

  ttl {
    attribute_name = "ttl"
    enabled        = true
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

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}
```

</details>

#### Configure idleness detection (ping/pong)

Set up server->client pinging for socket idleness detection.

> Note: While not a hard requirement, this is [strongly recommended](#%EF%B8%8F-limitations).

<details>

<summary>📖 Configuring instance</summary>

Pass a `ping` argument to configure delays and what state machine to invoke.

```ts
const instance = createInstance({
  /* ... */
  ping: {
    interval: 60, // Rate in seconds to send ping message
    timeout: 30, // Threshold for pong response before closing socket
    machineArn: process.env.MACHINE_ARN, // State machine to invoke
  },
});
```

Export the resulting handler for use by the state machine.

```ts
export const stateMachineHandler = instance.stateMachineHandler;
```

</details>

<details>

<summary>💾 serverless framework example</summary>

Create a function which exports the aforementioned machine handler.

```yaml
functions:
  machine:
    handler: src/handler.stateMachineHandler
```

Use the [serverless-step-functions](https://github.com/serverless-operations/serverless-step-functions) plugin to create a state machine which invokes the machine handler.

```yaml
stepFunctions:
  stateMachines:
    ping:
      role: !GetAtt IamRoleLambdaExecution.Arn
      definition:
        StartAt: Wait
        States:
          Eval:
            Type: Task
            Resource: !GetAtt machine.Arn
            Next: Choose
          Wait:
            Type: Wait
            SecondsPath: '$.seconds'
            Next: Eval
          Choose:
            Type: Choice
            Choices:
              - Not:
                  Variable: '$.state'
                  StringEquals: 'ABORT'
                Next: Wait
            Default: End
          End:
            Type: Pass
            End: true
```

The state machine _arn_ can be passed to your websocket handler function via outputs.

> Note: [naming of resources](https://www.serverless.com/framework/docs/providers/aws/guide/resources/) will be dependent the function/machine naming in the serverless config.

```yaml
functions:
  subscription:
    handler: src/handler.gatewayHandler
    environment:
      PING_STATE_MACHINE_ARN: ${self:resources.Outputs.PingStateMachine.Value}
    # ...

resources:
  Outputs:
    PingStateMachine:
      Value:
        Ref: PingStepFunctionsStateMachine
```

On `connection_init`, the state machine will be invoked. Ensure that the websocket handler has the following permissions.

```yaml
- Effect: Allow
  Resource: !GetAtt PingStepFunctionsStateMachine.Arn
  Action:
    - states:StartExecution
```

The state machine itself will need the following permissions

```yaml
- Effect: Allow
  Resource: !GetAtt connectionsTable.Arn
  Action:
    - dynamodb:GetItem
    - dynamodb:UpdateItem
- Effect: Allow
  Resource: '*'
  Action:
    - execute-api:*
```

> Note: For a full reproduction, see the example project.

</details>

<details>
  <summary>💾 terraform example</summary>

Create a function which can be invoked by the state machine.

```tf
resource "aws_lambda_function" "machine" {
  function_name    = "machine"
  runtime          = "nodejs14.x"
  filename         = data.archive_file.handler.output_path
  source_code_hash = data.archive_file.handler.output_base64sha256
  handler          = "example.stateMachineHandler"
  role             = aws_iam_role.state_machine_function.arn

  environment {
    variables = {
      CONNECTIONS_TABLE   = aws_dynamodb_table.connections.id
      SUBSCRIPTIONS_TABLE = aws_dynamodb_table.subscriptions.id
    }
  }
}
```

Create the following state machine which will be invoked by the gateway handler.

```tf
resource "aws_sfn_state_machine" "ping_state_machine" {
  name     = "ping-state-machine"
  role_arn = aws_iam_role.state_machine.arn
  definition = jsonencode({
    StartAt = "Wait"
    States = {
      Wait = {
        Type        = "Wait"
        SecondsPath = "$.seconds"
        Next        = "Eval"
      }
      Eval = {
        Type     = "Task"
        Resource = aws_lambda_function.machine.arn
        Next     = "Choose"
      }
      Choose = {
        Type = "Choice"
        Choices = [{
          Not = {
            Variable     = "$.state"
            StringEquals = "ABORT"
          }
          Next = "Wait"
        }]
        Default = "End"
      }
      End = {
        Type = "Pass"
        End  = true
      }
    }
  })
}
```

The state machine _arn_ can be passed to your websocket handler via an environment variable.

```tf
resource "aws_lambda_function" "gateway_handler" {
  # ...

  environment {
    variables = {
      # ...
      PING_STATE_MACHINE_ARN = aws_sfn_state_machine.ping_state_machine.arn
    }
  }
}
```

> Note: For a full reproduction, see the example project.

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
import { withFilter, subscribe } from 'subscriptionless/subscribe';

// Subscription agnostic filter
withFilter(subscribe('MY_TOPIC'), {
  attr1: '`attr1` must have this value',
  attr2: {
    attr3: 'Nested attributes work fine',
  },
});

// Subscription specific filter
withFilter(subscribe('MY_TOPIC'), (root, args, context, info) => ({
  userId: args.userId,
}));
```

</details>

<details>
  
<summary>📖 Concatenating topic subscriptions</summary>

Join multiple topic subscriptions together using `concat`.

```tsx
import { concat, subscribe } from 'subscriptionless/subscribe';

concat(subscribe('TOPIC_1'), subscribe('TOPIC_2'));
```

</details>

<details>
  
<summary>📖 Publishing events</summary>

Use the `publish` on your subscriptionless instance to publish events to active subscriptions.

```tsx
instance.publish({
  type: 'MY_TOPIC',
  payload: 'HELLO',
});
```

Events can come from many sources

```tsx
// SNS Event
export const snsHandler = (event) =>
  Promise.all(
    event.Records.map((r) =>
      instance.publish({
        topic: r.Sns.TopicArn.substring(r.Sns.TopicArn.lastIndexOf(':') + 1), // Get topic name (e.g. "MY_TOPIC")
        payload: JSON.parse(r.Sns.Message),
      })
    )
  );

// Manual Invocation
export const invocationHandler = (payload) =>
  instance.publish({ topic: 'MY_TOPIC', payload });
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
    myAttr: 'hello',
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
    myAttr: 'hello',
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
import { prepareResolvers } from 'subscriptionless/subscribe';

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
      subscribe: subscribe('MY_TOPIC'),
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

Called on an incoming API Gateway `$connect` event.

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

Called on an incoming API Gateway `$disconnect` event.

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

Called on incoming graphql-ws `connection_init` message.

`onConnectionInit` can be used to verify the `connection_init` payload prior to persistence.

> **Note:** Any sensitive data in the incoming message should be removed at this stage.

```ts
const instance = createInstance({
  /* ... */
  onConnectionInit: ({ message }) => {
    const token = message.payload.token;

    if (!myValidation(token)) {
      throw Error('Token validation failed');
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

Called on incoming graphql-ws `subscribe` message.

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

Called on graphql-ws `complete` message.

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
  
<summary>📖 Ping (onPing)</summary>

Called on incoming graphql-ws `ping` message.

```ts
const instance = createInstance({
  /* ... */
  onPing: ({ event, message }) => {
    /* */
  },
});
```

</details>

<details>
  
<summary>📖 Pong (onPong)</summary>

Called on incoming graphql-ws `pong` message.

```ts
const instance = createInstance({
  /* ... */
  onPong: ({ event, message }) => {
    /* */
  },
});
```

</details>

<details>

<summary>📖 Error (onError)</summary>

Called on unexpected errors during resolution of API Gateway or graphql-ws events.

```ts
const instance = createInstance({
  /* ... */
  onError: (error, context) => {
    /* */
  },
});
```

</details>
