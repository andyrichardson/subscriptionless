import { DataMapper } from '@aws/dynamodb-data-mapper';
import { ServerArgs } from './types';
import { publish } from './pubsub/publish';
import { createModel, Connection, Subscription } from './model';
import { handleGatewayEvent } from './gateway';
import { handleStateMachineEvent } from './stepFunctionHandler';

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

  return {
    gatewayHandler: handleGatewayEvent(closure),
    stateMachineHandler: handleStateMachineEvent(closure),
    publish: publish(closure),
  };
};

export { prepareResolvers } from './utils';
export * from './pubsub/subscribe';
