import { Handler, APIGatewayEvent } from 'aws-lambda';
import { GRAPHQL_TRANSPORT_WS_PROTOCOL, MessageType } from 'graphql-ws';
import { ServerClosure, WebsocketResponse } from './types';
import {
  complete,
  connection_init,
  subscribe,
  disconnect,
  ping,
} from './messages';
import { pong } from './messages/pong';

export const handleGatewayEvent = (
  c: ServerClosure
): Handler<APIGatewayEvent, WebsocketResponse> => async (event) => {
  if (!event.requestContext) {
    return {
      statusCode: 200,
      body: '',
    };
  }

  if (event.requestContext.eventType === 'CONNECT') {
    await c.onConnect?.({ event });
    return {
      statusCode: 200,
      headers: {
        'Sec-WebSocket-Protocol': GRAPHQL_TRANSPORT_WS_PROTOCOL,
      },
      body: '',
    };
  }

  if (event.requestContext.eventType === 'MESSAGE') {
    const message = JSON.parse(event.body!);

    if (message.type === MessageType.ConnectionInit) {
      await connection_init(c)({ event, message });
      return {
        statusCode: 200,
        body: '',
      };
    }

    if (message.type === MessageType.Subscribe) {
      await subscribe(c)({ event, message });
      return {
        statusCode: 200,
        body: '',
      };
    }

    if (message.type === MessageType.Complete) {
      await complete(c)({ event, message });
      return {
        statusCode: 200,
        body: '',
      };
    }

    if (message.type === MessageType.Ping) {
      await ping(c)({ event, message });
      return {
        statusCode: 200,
        body: '',
      };
    }

    if (message.type === MessageType.Pong) {
      await pong(c)({ event, message });
      return {
        statusCode: 200,
        body: '',
      };
    }
  }

  if (event.requestContext.eventType === 'DISCONNECT') {
    await disconnect(c)({ event, message: null });
    return {
      statusCode: 200,
      body: '',
    };
  }

  return {
    statusCode: 200,
    body: '',
  };
};
