import { parse } from "graphql";
import { equals } from "@aws/dynamodb-expressions";
import { buildExecutionContext } from "graphql/execution/execute";
import { getResolverAndArgs, promisify } from "../utils";
import { MessageHandler } from "./types";
import { assign } from "../model";

export const disconnect: MessageHandler<null> = (c) => async ({ event }) => {
  try {
    await promisify(() => c.onDisconnect?.({ event }));

    const connection = await c.mapper.get(
      assign(new c.model.Connection(), {
        id: event.requestContext.connectionId!,
      })
    );
    const entities = await c.mapper.query(
      c.model.Subscription,
      {
        connectionId: equals(event.requestContext.connectionId),
      },
      { indexName: "ConnectionIndex" }
    );

    const completed = {} as Record<string, boolean>;
    let deletions = [] as Promise<any>[];
    for await (const entity of entities) {
      deletions = [
        ...deletions,
        (async () => {
          // only call onComplete per subscription
          if (!completed[entity.subscriptionId]) {
            completed[entity.subscriptionId] = true;

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
          }

          await c.mapper.delete(entity);
        })(),
      ];
    }

    await Promise.all([...deletions, c.mapper.delete(connection)]);
  } catch (err) {
    await promisify(() => c.onError?.(err, { event }));
  }
};
