import { APIGatewayWebSocketEvent, ServerClosure } from '../types';

export type MessageHandler<T> = (
  c: ServerClosure
) => (arg: { event: APIGatewayWebSocketEvent; message: T }) => void;
