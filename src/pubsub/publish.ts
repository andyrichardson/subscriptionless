import {
  attributeNotExists,
  equals,
  ConditionExpression,
} from "@aws/dynamodb-expressions";
import { parse, execute } from "graphql";
import { MessageType } from 'graphql-ws';
import { assign, GraphQLConnection, Subscription } from "../model";
import { ServerArgs, ServerClosure } from "../types";
import { sendMessage } from "../utils";

type PubSubEvent = {
  topic: string;
  payload: any;
};

export const publish = (
  c: Omit<ServerClosure, "gateway"> & { gateway: ServerArgs["gateway"] }
) => async (event: PubSubEvent) => {
  const subscriptions = await getFilteredSubs(c)(event);
  const iters = subscriptions.map(async (sub) => {
    const conn = await c.mapper.get(
      assign(new GraphQLConnection(), { id: sub.connectionId })
    );
    const result = execute(
      c.schema,
      parse(sub.subscription.query),
      event,
      {}, // TODO: context
      sub.subscription.variables,
      sub.subscription.operationName,
      undefined
    );

    const gateway =
      typeof c.gateway === "function"
        ? c.gateway({ requestContext: conn.requestContext } as any)
        : c.gateway;
        
    sendMessage({ ...c, gateway })({
      connectionId: conn.id,
      message: {
        id: sub.id,
        type: MessageType.Next,
        payload: await result,
      },
    });
  });
  return await Promise.all(iters);
};

const getFilteredSubs = (c: Omit<ServerClosure, "gateway">) => async (
  event: PubSubEvent
): Promise<Subscription[]> => {
  const flattenPayload = flatten(event.payload);
  const iterator = c.mapper.query(
    Subscription,
    {
      type: equals("subscription"),
      topic: equals(event.topic),
    },
    {
      filter: {
        type: "And",
        conditions: Object.entries(flattenPayload).reduce(
          (p, [key, value]) => [
            ...p,
            {
              type: "Or",
              conditions: [
                {
                  ...attributeNotExists(),
                  subject: `filter.${key}`,
                },
                {
                  ...equals(value),
                  subject: `filter.${key}`,
                },
              ],
            },
          ],
          [] as ConditionExpression[]
        ),
      },
      indexName: "TopicIndex",
    }
  );

  // Aggregate all targets
  const subs: Subscription[] = [];
  for await (const sub of iterator) {
    subs.push(sub);
  }

  return subs;
};

export const flatten = (
  obj: object
): Record<string, number | string | boolean> =>
  Object.entries(obj).reduce((p, [k1, v1]) => {
    if (v1 && typeof v1 === "object") {
      const next = Object.entries(v1).reduce(
        (prev, [k2, v2]) => ({
          ...prev,
          [`${k1}.${k2}`]: v2,
        }),
        {}
      );
      return {
        ...p,
        ...flatten(next),
      };
    }

    if (
      typeof v1 === "string" ||
      typeof v1 === "number" ||
      typeof v1 === "boolean"
    ) {
      return { ...p, [k1]: v1 };
    }

    return p;
  }, {});
