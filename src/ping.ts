import { assign } from './model';
import { ServerClosure } from './types';

export const ping = (c: ServerClosure) => async (event: any) => {
  console.log(event);
  return;
  return {
    choice: 'Timeout',
  };
  // const connection = await c.mapper.get(
  //   assign(new c.model.Connection(), { id: connectionId })
  // ).catch(err => );

  // // Connection was closed
  // if (!connection) {
  //   return {}
  // }
  // connection.ponged = false;
  // await c.mapper.update(connection);

  // const sf = new StepFunctions();
  // sf.startExecution({ input: JSON.stringify({ connectionId }), stateMachineArn:  });
};
