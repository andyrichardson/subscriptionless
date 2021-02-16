## Usage

### Creating a handler

```ts
const server = createServer({
  schema,
  gateway,
});

export const handler = server.handler;
```

### Subscribing to events

```ts
import { subscribe } from 'gqsub/subscribe';

export const resolver = {
  Subscribe: {
    mySubscription: {
      resolve: (event, args, context) => {/* ... */}
      subscribe: subscribe('MY_TOPIC'),
    }
  }
}
```

### Handling subscription start and stop

```ts
export const resolver = {
  Subscribe: {
    mySubscription: {
      resolve: (event, args, context) => {/* ... */}
      subscribe: subscribe('MY_TOPIC'),
      onStart: () => {/* ... */},
      onStop: () => {/* ... */}
    }
  }
}
```

### Authorization (connection_init)

`onConnectionInit` can be used to verify the `connection_init` payload prior to persistence.

```ts
const server = createServer({
  /* ... */
  onConnectionInit: ({ message }) => {
    const token = message.payload.token;

    if (!myValidation(token)) {
      throw Error("Token validation failed");
    }

    // Prevent sensitive data from being written to DB
    delete message.payload.token;
  }
})
```