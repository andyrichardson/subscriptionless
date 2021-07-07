import { StepFunctions } from 'aws-sdk';
import { ConnectionInitMessage, MessageType } from 'graphql-ws';
import { assign } from '../model';
import { StateFunctionInput } from '../types';
import { sendMessage, deleteConnection, promisify } from '../utils';
import { MessageHandler } from './types';

/** Handler function for 'connection_init' message. */
export const connection_init: MessageHandler<ConnectionInitMessage> = (
  c
) => async ({ event, message }) => {
  try {
    const res = c.onConnectionInit
      ? await promisify(() => c.onConnectionInit!({ event, message }))
      : message.payload;

    const pingerInvocation = c.pinger
      ? (
          await new StepFunctions()
            .startExecution({
              stateMachineArn: c.pinger,
              name: event.requestContext.connectionId!,
              input: JSON.stringify({
                connectionId: event.requestContext.connectionId!,
                domainName: event.requestContext.domainName!,
                stage: event.requestContext.stage,
                state: 'PING',
                choice: 'WAIT',
                seconds: 10,
              } as StateFunctionInput),
            })
            .promise()
        ).executionArn
      : undefined;

    // Write to persistence
    const connection = assign(new c.model.Connection(), {
      id: event.requestContext.connectionId!,
      requestContext: event.requestContext,
      payload: res,
      pingerInvocation,
    });
    await c.mapper.put(connection);
    return sendMessage({
      ...event.requestContext,
      message: { type: MessageType.ConnectionAck },
    });
  } catch (err) {
    await promisify(() => c.onError?.(err, { event, message }));
    await deleteConnection(event.requestContext);
  }
};
