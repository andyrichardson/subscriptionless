import { PingMessage, MessageType } from 'graphql-ws';
import { sendMessage, deleteConnection, promisify } from '../utils';
import { MessageHandler } from './types';

/** Handler function for 'ping' message. */
export const ping: MessageHandler<PingMessage> =
  (c) =>
  async ({ event, message }) => {
    try {
      await promisify(() => c.onPing?.({ event, message }));
      return sendMessage(c)({
        ...event.requestContext,
        message: { type: MessageType.Pong },
      });
    } catch (err) {
      await promisify(() => c.onError?.(err, { event, message }));
      await deleteConnection(c)(event.requestContext);
    }
  };
