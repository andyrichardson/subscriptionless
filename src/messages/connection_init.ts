import { DataMapper } from "@aws/dynamodb-data-mapper";
import { ConnectionInitMessage, MessageType } from "graphql-ws";
import { assign, GraphQLConnection } from "../model";
import { sendMessage, promisify } from "../utils";
import { MessageHandler } from "./types";

export const connection_init: MessageHandler<ConnectionInitMessage> = (
  c
) => async ({ event, message }) => {
  try {
    const res = await promisify(() => c.onConnectionInit({ event, message }));

    // Write to persistence
    const connection = assign(new GraphQLConnection(), {
      id: event.requestContext.connectionId!,
      requestContext: event.requestContext,
      payload: res,
    });
    await c.mapper.put(connection);
    return sendMessage(c)({
      connectionId: event.requestContext.connectionId!,
      message: { type: MessageType.ConnectionAck },
    });
  } catch (err) {
    // Close connection
  }
};
