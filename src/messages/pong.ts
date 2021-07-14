import { MessageType, PongMessage } from 'graphql-ws';
import { assign } from '../model';
import { sendMessage, deleteConnection, promisify } from '../utils';
import { MessageHandler } from './types';

/** Handler function for 'pong' message. */
export const pong: MessageHandler<PongMessage> = (c) => async ({
  event,
  message,
}) => {
  try {
    await promisify(() => c.onPong?.({ event, message }));
    await c.mapper.update(
      assign(new c.model.Connection(), {
        id: event.requestContext.connectionId!,
        hasPonged: true,
      }),
      {
        onMissing: 'skip',
      }
    );
  } catch (err) {
    await promisify(() => c.onError?.(err, { event, message }));
    await deleteConnection(event.requestContext);
  }
};
