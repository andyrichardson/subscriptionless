import { APIGatewayEvent } from "aws-lambda";
import { DataMapper } from "@aws/dynamodb-data-mapper";
import { Handler } from "aws-lambda";
import { ServerArgs } from "./types";
import { handleWebSocket } from "./websocket";

export const createServer = (opts: ServerArgs) => {
  const handler: Handler = (...args) => {
    const closure = {
      ...opts,
      gateway:
        typeof opts.gateway === "function"
          ? opts.gateway(args[0])
          : opts.gateway,
      mapper: new DataMapper({ client: opts.dynamodb }),
    };

    return handleWebSocket(closure)(...args);
  };

  return {
    handler,
  };
};
