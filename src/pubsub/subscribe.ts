import { APIGatewayEvent } from 'aws-lambda';
import { Message } from 'graphql-ws';

export const subscribe = (topic: string) => subscribeHandler({ topics: [topic] });

const subscribeHandler = (c: { topics: string[] }) => {
  const handler = () => {
    const iterator = async function* () {
      yield null;
    };

    return iterator();
  };
  handler.getTopics = () => c.topics;
  return handler;
};

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