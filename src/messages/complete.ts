import { parse } from 'graphql';
import { CompleteMessage } from 'graphql-ws';
import { buildExecutionContext } from 'graphql/execution/execute';
import {
  constructContext,
  deleteConnection,
  getResolverAndArgs,
  promisify,
} from '../utils';
import { MessageHandler } from './types';
import { disconnect } from './disconnect';

export const complete: MessageHandler<CompleteMessage> = (c) => async ({
  event,
  message,
}) => {
  try {
    await promisify(() => c.onComplete?.({ event, message }));

    const topicSubscriptions = await c.mapper.query(c.model.Subscription, {
      id: `${event.requestContext.connectionId!}|${message.id}`,
    });

    let deletions = [] as Promise<any>[];
    for await (const entity of topicSubscriptions) {
      deletions = [
        ...deletions,
        (async () => {
          // only call onComplete per subscription
          if (deletions.length === 0) {
            const execContext = buildExecutionContext(
              c.schema,
              parse(entity.subscription.query),
              undefined,
              await constructContext(c)(entity),
              entity.subscription.variables,
              entity.subscription.operationName,
              undefined
            );

            if (!('operation' in execContext)) {
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

    await Promise.all(deletions);
  } catch (err) {
    await Promise.allSettled([
      promisify(() => c.onError?.(err, { event, message })),
      disconnect(c)({ event, message: null })
    ]);
    await deleteConnection(event.requestContext);
  }
};
