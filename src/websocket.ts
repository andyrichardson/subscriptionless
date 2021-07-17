import { Handler } from 'aws-lambda';
import { GRAPHQL_TRANSPORT_WS_PROTOCOL, MessageType } from 'graphql-ws';
import {
  APIGatewayWebSocketEvent,
  ServerClosure,
  WebsocketResponse,
} from './types';
import { complete, connection_init, subscribe, disconnect } from './messages';

export const handleWebSocket = (
  c: ServerClosure
): Handler<APIGatewayWebSocketEvent, WebsocketResponse> => async (event) => {
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
