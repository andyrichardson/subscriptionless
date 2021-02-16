import { parse } from "graphql";
import { CompleteMessage, MessageType } from "graphql-ws";
import { buildExecutionContext } from "graphql/execution/execute";
import { assign, Subscription } from "../model";
import { getResolverAndArgs, promisify, sendMessage } from "../utils";
import { MessageHandler } from "./types";

export const complete: MessageHandler<CompleteMessage> = (c) => async ({
  event,
  message,
}) => {
  try {
    await promisify(() => c.onComplete({ event, message }));

    const entity = await c.mapper.get(
      assign(new Subscription(), {
        id: `${event.requestContext.connectionId!}|${message.id}`,
      })
    );
  
    const execContext = buildExecutionContext(
      c.schema,
      parse(entity.subscription.query),
      undefined,
      {}, // Context
      entity.subscription.variables,
      entity.subscription.operationName,
      undefined
    );
  
    if (!("operation" in execContext)) {
      throw execContext;
    }
  
    const [field, root, args, context, info] = getResolverAndArgs(c)(execContext);
  
    const onComplete = field.resolve.onComplete;
    if (onComplete) {
      await onComplete(root, args, context, info);
    }
  
    await c.mapper.delete(entity);
  } catch(err) {
    // send some kind of error?
  }
};
