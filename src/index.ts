import { DataMapper } from '@aws/dynamodb-data-mapper';
import { Handler } from 'aws-lambda';
import { ServerArgs } from './types';
import { handleWebSocket } from './websocket';
import { publish } from './pubsub/publish';
import { createModel, Connection, Subscription } from './model';
import { ping } from './ping';

export const createInstance = (opts: ServerArgs) => {
  const closure = {
    ...opts,
    model: {
      Subscription: createModel({
        model: Subscription,
        table:
          opts.tableNames?.subscriptions || 'subscriptionless_subscriptions',
      }),
      Connection: createModel({
        model: Connection,
        table: opts.tableNames?.connections || 'subscriptionless_connections',
      }),
    },
    mapper: new DataMapper({ client: opts.dynamodb }),
  } as const;

  const handler: Handler = (...args) => handleWebSocket(closure)(...args);

  return {
    handler,
    ping: ping(closure),
    publish: publish(closure),
  };
};

export { prepareResolvers } from './utils';
export * from './pubsub/subscribe';
