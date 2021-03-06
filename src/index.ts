import { DataMapper } from "@aws/dynamodb-data-mapper";
import { Handler } from "aws-lambda";
import { ServerArgs } from "./types";
import { handleWebSocket } from "./websocket";
import { publish } from "./pubsub/publish";

export const createServer = (opts: ServerArgs) => {
  const closure = {
    ...opts,
    mapper: new DataMapper({ client: opts.dynamodb }),
  };

  const handler: Handler = (...args) => {
    const closure = {
      ...opts,
      gateway:
        typeof opts.gateway === "function"
          ? opts.gateway(args[0])
          : opts.gateway,
      mapper: new DataMapper({ client: opts.dynamodb }),
    };

    return handleWebSocket({
      ...closure,
      gateway:
        typeof opts.gateway === "function"
          ? opts.gateway(args[0])
          : opts.gateway,
    })(...args);
  };

  return {
    handler,
    publish: publish(closure),
  };
};

export { prepareResolvers } from './utils';
export * from './pubsub/subscribe';