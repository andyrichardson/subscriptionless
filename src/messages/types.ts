import { APIGatewayEvent } from 'aws-lambda';
import { ServerClosure } from '../types';

export type MessageHandler<T> = (
  c: ServerClosure
) => (arg: { event: APIGatewayEvent; message: T }) => void;
