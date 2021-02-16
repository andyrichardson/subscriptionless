import { parse } from "graphql";
import { equals } from "@aws/dynamodb-expressions";
import { CompleteMessage, MessageType } from "graphql-ws";
import { buildExecutionContext } from "graphql/execution/execute";
import { Subscription } from "../model";
import { getResolverAndArgs, promisify, sendMessage } from "../utils";
import { MessageHandler } from "./types";

export const disconnect: MessageHandler<CompleteMessage> = (c) => async ({
  event,
}) => {
  try {
    await promisify(() => c.onDisconnect({ event }));

    const entities = await c.mapper.query(Subscription, {
      connectionId: equals(event.requestContext.connectionId),
    });

    let deletions = [];
    for await (const entity of entities) {
      deletions = [
        ...deletions,
        (async () => {
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

          const [field, root, args, context, info] = getResolverAndArgs(c)(
            execContext
          );

          const onComplete = field.resolve.onComplete;
          if (onComplete) {
            await onComplete(root, args, context, info);
          }

          await c.mapper.delete(entity);
        })(),
      ];
    }

    await Promise.all(deletions);
  } catch (err) {
    // send some kind of error?
  }
};
