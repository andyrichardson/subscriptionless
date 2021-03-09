import { SubscribeMessage, MessageType } from "graphql-ws";
import { validate, parse } from "graphql";
import {
  buildExecutionContext,
  assertValidExecutionArguments,
} from "graphql/execution/execute";
import { MessageHandler } from "./types";
import { deleteConnection, getResolverAndArgs, promisify, sendMessage } from "../utils";
import { assign, Subscription } from "../model";
import { ServerClosure, SubscribeHandler } from "../types";

export const subscribe: MessageHandler<SubscribeMessage> = (c) => async ({
  event,
  message,
}) => {
  try {
    await promisify(() => c.onSubscribe?.({ event, message }));

    // Check for variable errors
    const errors = validateMessage(c)(message);

    if (errors) {
      throw errors;
    }

    const execContext = buildExecutionContext(
      c.schema,
      parse(message.payload.query),
      undefined,
      {}, // Context
      message.payload.variables,
      message.payload.operationName,
      undefined
    );

    if (!("operation" in execContext)) {
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

    const [field, root, args, context, info] = getResolverAndArgs(c)(
      execContext
    );

    // Dispatch onStart side effect
    const onStart = field.resolve.onStart;
    if (onStart) {
      await onStart(root, args, context, info);
    }

    const topicDefinitions = (field.subscribe as SubscribeHandler)(root, args, context, info).definitions; // Access subscribe instance
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
          requestContext: event.requestContext,
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
    return [err];
  }
};
