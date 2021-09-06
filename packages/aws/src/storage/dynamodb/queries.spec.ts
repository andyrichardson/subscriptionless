import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { parse, execute } from 'graphql';
import { dynamodbSchema } from './index';

const config = {
  client: new DynamoDBClient({
    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT,
    region: 'local',
  }),
  tableNames: {
    connections: 'connections',
    subscriptions: 'subscriptions',
    topicSubscriptions: 'topicSubscriptions',
  },
};

afterAll(() => config.client.destroy());

const schema = dynamodbSchema(config);

describe('on getConnection query', () => {
  const document = parse(`
    query GetConnection($id: ID!) {
      getConnection(id: $id) {
        id
        payload
      }
    }
  `);

  it('returns item from DynamoDB', async () => {
    const variableValues = {
      id: '1',
    };

    const res = await execute({
      document,
      variableValues,
      schema,
    });

    expect(res.data!.getConnection).toMatchInlineSnapshot(`
Object {
  "id": "1",
  "payload": Object {
    "test": "some payload",
  },
}
`);
  });

  describe('on subscriptions field requested', () => {
    const document = parse(`
      query GetConnection($id: ID!) {
        getConnection(id: $id) {
          id
          payload
          subscriptions {
            id
          }
        }
      }
    `);

    it('joins results', async () => {
      const variableValues = {
        id: '1',
      };

      const res = await execute({
        document,
        variableValues,
        schema,
      });

      console.log(res);
      expect(res.data!.getConnection).toMatchInlineSnapshot(`
      Object {
        "id": "1",
        "payload": Object {
          "test": "some payload",
        },
      }
      `);
    });
  });
});

describe('on getSubscription query', () => {
  const document = parse(`
    query GetSubscription($id: ID!) {
      getSubscription(id: $id) {
        id
        payload
      }
    }
  `);

  it('returns item from DynamoDB', async () => {
    const variableValues = {
      id: '1#1',
    };

    const res = await execute({
      document,
      variableValues,
      schema,
    });

    expect(res.data!.getSubscription).toMatchInlineSnapshot(`
Object {
  "id": "1#1",
}
`);
  });
});
