import { SubscribeMessage, MessageType } from 'graphql-ws';
import {
  validate,
  parse,
  execute,
  GraphQLError,
  ExecutionResult,
} from 'graphql';
import {
  buildExecutionContext,
  assertValidExecutionArguments,
} from 'graphql/execution/execute';
import { MessageHandler } from './types';
import {
  constructContext,
  deleteConnection,
  getResolverAndArgs,
  isAsyncIterable,
  promisify,
  sendMessage,
} from '../utils';
import { assign } from '../model';
import { ServerClosure, SubscribeHandler } from '../types';

/** Handler function for 'subscribe' message. */
export const subscribe: MessageHandler<SubscribeMessage> =
  (c) =>
  async ({ event, message }) => {
    try {
      const [connection] = await Promise.all([
        await c.mapper.get(
          assign(new c.model.Connection(), {
            id: event.requestContext.connectionId!,
          })
        ),
        await promisify(() => c.onSubscribe?.({ event, message })),
      ]);
      const connectionParams = connection.payload || {};

      // GraphQL validation
      const errors = validateMessage(c)(message);

      if (errors) {
        return sendMessage({
          ...event.requestContext,
          message: {
            type: MessageType.Error,
            id: message.id,
            payload: errors,
          },
        });
      }

      const contextValue = await constructContext(c)({ connectionParams });

      const execContext = buildExecutionContext(
        c.schema,
        parse(message.payload.query),
        undefined,
        contextValue,
        message.payload.variables,
        message.payload.operationName,
        undefined
      );

      if (!('operation' in execContext)) {
        return sendMessage({
          ...event.requestContext,
          message: {
            type: MessageType.Next,
            id: message.id,
            payload: {
              errors: execContext,
            },
          },
        });
      }

      if (execContext.operation.operation !== 'subscription') {
        const result = await execute(
          c.schema,
          parse(message.payload.query),
          undefined,
          contextValue,
          message.payload.variables,
          message.payload.operationName,
          undefined
        );

        // Support for @defer and @stream directives
        const parts = isAsyncIterable<ExecutionResult>(result)
          ? result
          : [result];
        for await (let part of parts) {
          await sendMessage({
            ...event.requestContext,
            message: {
              type: MessageType.Next,
              id: message.id,
              payload: part,
            },
          });
        }

        await sendMessage({
          ...event.requestContext,
          message: {
            type: MessageType.Complete,
            id: message.id,
          },
        });

        return;
      }

      const [field, root, args, context, info] =
        getResolverAndArgs(c)(execContext);

      // Dispatch onSubscribe side effect
      const onSubscribe = field.resolve.onSubscribe;
      if (onSubscribe) {
        await onSubscribe(root, args, context, info);
      }

      const topicDefinitions = (field.subscribe as SubscribeHandler)(
        root,
        args,
        context,
        info
      ).definitions; // Access subscribe instance
      await Promise.all(
        topicDefinitions.map(async ({ topic, filter }) => {
          const subscription = assign(new c.model.Subscription(), {
            id: `${event.requestContext.connectionId}|${message.id}`,
            topic,
            filter: filter || {},
            subscriptionId: message.id,
            subscription: {
              variableValues: args,
              ...message.payload,
            },
            connectionId: event.requestContext.connectionId!,
            connectionParams,
            requestContext: event.requestContext,
            ttl: connection.ttl,
          });
          await c.mapper.put(subscription);
        })
      );
    } catch (err) {
      await promisify(() => c.onError?.(err, { event, message }));
      await deleteConnection(event.requestContext);
    }
  };

/** Validate incoming query and arguments */
const validateMessage = (c: ServerClosure) => (message: SubscribeMessage) => {
  const errors = validate(c.schema, parse(message.payload.query));

  if (errors && errors.length) {
    return errors;
  }

  try {
    assertValidExecutionArguments(
      c.schema,
      parse(message.payload.query),
      message.payload.variables
    );
  } catch (err) {
    return [err] as GraphQLError[];
  }
};
