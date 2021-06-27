import { DynamoDB } from 'aws-sdk';
import { PersistenceArgs, PersistenceState } from './types';
import { Persistence } from '../types';
import { addMinutes } from './util';
import { DataMapper } from '@aws/dynamodb-data-mapper';
import { assign, Connection, createModel, Subscription } from './model';

export const createPersistence = (args: PersistenceArgs): Persistence => {
  const state = {
    ...args,
    mapper: new DataMapper({ client: args.dynamodb }),
    model: {
      TopicSubscription: createModel({
        model: Subscription,
        table:
          args.tableNames?.topicSubscriptions || 'subscriptionless_subscriptions',
      }),
      Connection: createModel({
        model: Connection,
        table: args.tableNames?.connections || 'subscriptionless_connections',
      }),
    },
    docClient: new DynamoDB.DocumentClient({ service: args.dynamodb }),
    ttl: args.ttl ?? 180,
  };

  return {
    connection: {
      get: connectionGet(state),
      put: connectionPut(state),
      delete: connectionDelete(state),
    },
    topicSubscription: {
      get: 
    }
  };
};

// const [connection] = await Promise.all([
//   await c.mapper.get(
//     assign(new c.model.Connection(), {
//       id: event.requestContext.connectionId!,
//     })
//   ),
//   await promisify(() => c.onSubscribe?.({ event, message })),
// ]);

const connectionGet = (
  { mapper, model }: PersistenceState
): Persistence['connection']['get'] => ({ id }) => mapper.get<Connection>(assign(new model.Connection(), { id }))

// const connectionGet = (
//   state: PersistenceState
// ): Persistence['connection']['get'] => ({ id }) =>
//   state.docClient
//     .get({
//       TableName: state.tableNames.connections,
//       Key: {
//         id,
//       },
//     })
//     .promise()
//     .then((v) => v.Item as any);

// const connectionPut = (
//   state: PersistenceState
// ): Persistence['connection']['put'] => (connection) => {
//   const Item: DynamoDBConnection = {
//     ...connection,
//     createdAt: new Date().toISOString(),
//     ttl: addMinutes(new Date(), state.ttl).toISOString(),
//   };
//   return state.docClient
//     .put({
//       TableName: state.tableNames.connections,
//       Item,
//     })
//     .promise();
// };

// const connectionDelete = (
//   state: PersistenceState
// ): Persistence['connection']['delete'] => ({ id }) =>
//   state.docClient.delete({
//     TableName: state.tableNames.connections,
//     Key: {
//       id,
//     },
//   });

// const topicSubscriptionGet = (state: PersistenceState): Persistence['topicSubscription']['get'] => (constraints) => state.docClient.get({
//   TableName: state.tableNames.topicSubscriptions,
//   Key: {
//     id: constraints.id,
//   }
// }).promise().then((v) => v.Item as any);

// topicSubscriptionGetMany = (state: PersistenceState): Persistence['topicSubscription']['getMany'] => (constraints) => state.docClient.query({
//   TableName: state.tableNames.topicSubscriptions,
//   IndexName: '',
//   QueryFilter: {
//     test
//   }
// }).promise();