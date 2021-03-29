import { ConnectionInitMessage, MessageType } from 'graphql-ws';
import { assign } from '../model';
import { sendMessage, deleteConnection, promisify } from '../utils';
import { disconnect } from './disconnect';
import { MessageHandler } from './types';

export const connection_init: MessageHandler<ConnectionInitMessage> = (
  c
) => async ({ event, message }) => {
  try {
    const res = c.onConnectionInit
      ? await promisify(() => c.onConnectionInit!({ event, message }))
      : message.payload;

    // Write to persistence
    const connection = assign(new c.model.Connection(), {
      id: event.requestContext.connectionId!,
      requestContext: event.requestContext,
      payload: res,
    });
    await c.mapper.put(connection);
    return sendMessage({
      ...event.requestContext,
      message: { type: MessageType.ConnectionAck },
    });
  } catch (err) {
    await Promise.allSettled([
      promisify(() => c.onError?.(err, { event, message })),
      disconnect(c)({ event, message: null })
    ]);
    await deleteConnection(event.requestContext);
  }
};
