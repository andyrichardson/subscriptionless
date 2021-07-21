import { DynamoDB } from 'aws-sdk';
import { DataMapper } from '@aws/dynamodb-data-mapper';
import { handleGatewayEvent } from './gateway';
import { createModel, Connection, Subscription } from './model';
import { publish } from './pubsub/publish';
import { handleStateMachineEvent } from './stateMachineHandler';
import { ServerArgs } from './types';

export const createInstance = (opts: ServerArgs) => {
  if (opts.ping && opts.ping.interval <= opts.ping.timeout) {
    throw Error('Ping interval value must be larger than ping timeout.');
  }

  const dynamodb = opts.dynamodb || new DynamoDB();
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
    mapper: new DataMapper({ client: dynamodb }),
  } as const;

  return {
    gatewayHandler: handleGatewayEvent(closure),
    stateMachineHandler: handleStateMachineEvent(closure),
    publish: publish(closure),
  };
};

export { prepareResolvers } from './utils';
export * from './pubsub/subscribe';
