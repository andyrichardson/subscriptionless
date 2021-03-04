import {
  ConnectionAckMessage,
  NextMessage,
  CompleteMessage,
  ErrorMessage,
} from "graphql-ws";
import { ServerClosure } from "../types";

export const sendMessage = (c: ServerClosure) => (a: {
  connectionId: string;
  message: ConnectionAckMessage | NextMessage | CompleteMessage | ErrorMessage;
}) =>
  c.gateway
    .postToConnection({
      ConnectionId: a.connectionId,
      Data: JSON.stringify(a.message),
    })
    .promise();

export const deleteConnection = (c: ServerClosure) => (a: {
  connectionId: string;
}) => c.gateway.deleteConnection({ ConnectionId: a.connectionId });
