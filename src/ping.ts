import { MessageType } from 'graphql-ws';
import { assign } from './model';
import { ServerClosure, StateFunctionInput } from './types';
import { sendMessage, deleteConnection } from './utils';

export const ping = (c: ServerClosure) => async (
  input: StateFunctionInput
): Promise<StateFunctionInput> => {
  const connection = assign(new c.model.Connection(), {
    id: input.connectionId,
  });

  // Initial state - send ping message
  if (input.state === 'PING') {
    await sendMessage({ ...input, message: { type: MessageType.Ping } });
    await c.mapper.update(assign(connection, { hasPonged: false }), {
      onMissing: 'skip',
    });
    return {
      ...input,
      state: 'REVIEW',
      seconds: c.pingpong!.delay,
    };
  }

  // Follow up state - check if pong was returned
  const conn = await c.mapper.get(connection);
  if (conn.hasPonged) {
    return {
      ...input,
      state: 'PING',
      seconds: c.pingpong!.timeout,
    };
  }

  await deleteConnection({ ...input });
  return {
    ...input,
    state: 'ABORT',
  };
};
