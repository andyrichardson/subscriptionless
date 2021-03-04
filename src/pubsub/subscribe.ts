import { APIGatewayEvent } from "aws-lambda";
import { Message } from "graphql-ws";

export const subscribe = (topic: string) =>
  subscribeHandler({ topics: [topic] });

const subscribeHandler = (c: { topics: string[] }) => {
  const handler = (...handlerArgs) => {
    const iterator = async function* () {
      yield handlerArgs[2].subscription.event;
    };

    return iterator();
  };
  handler.getTopics = () => c.topics;
  return handler;
};

/*
const execContext = buildExecutionContext(
  schema,
  document,
  undefined,
  {}, // Context
  { id: undefined }
);

      Array.isArray(execContext)
        ? { errors: execContext }
        : executeSubscription(execContext),
*/

/* 
Todo - Add support for multiple topics and filters

// 1
subscribe('TOPIC_A')

// 2
subscribe(['TOPIC_A', 'TOPIC_B'])

// 3
withFilter(subscribe('TOPIC_A'), { id: 1234 });

// 4
concat(
  withFilter(subscribe('TOPIC_A'), { id: 1234 }),
  subscribe('TOPIC_B')
)
*/
