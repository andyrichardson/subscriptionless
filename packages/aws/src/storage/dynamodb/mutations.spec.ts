import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
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

const documentClient = DynamoDBDocumentClient.from(config.client);

afterAll(() => config.client.destroy());

const schema = dynamodbSchema(config);

describe('on createConnection mutation', () => {
  const document = parse(`
    mutation CreateConnection($id: ID!, $payload: Object!) {
      createConnection(id: $id, payload: $payload)
    }
  `);

  it('adds item to DynamoDB', async () => {
    const variableValues = {
      id: '1',
      payload: { test: 1234 },
    };

    const res = await execute({
      document,
      variableValues,
      schema,
    });

    expect(res.data!.createConnection).toEqual(true);

    const result = await documentClient.send(
      new GetCommand({
        TableName: config.tableNames.connections,
        Key: { id: variableValues.id },
      })
    );
    expect(result.Item).toEqual(expect.objectContaining(variableValues));
  });
});

describe('on deleteConnection mutation', () => {
  const document = parse(`
    mutation DeleteConnection($id: ID!) {
      deleteConnection(id: $id)
    }
  `);

  it('removes item from DynamoDB', async () => {
    const variableValues = {
      id: '1234',
    };

    const res = await execute({
      document,
      variableValues,
      schema,
    });

    expect(res.data!.deleteConnection).toEqual(true);

    const result = await documentClient.send(
      new GetCommand({
        TableName: config.tableNames.connections,
        Key: { id: '1234' },
      })
    );
    expect(result.Item).toEqual(undefined);
  });
});

describe('on create subscription', () => {
  const document = parse(`
    mutation CreateSubscription($id: ID!, $payload: Object!) {
      createSubscription(id: $id, payload: $payload)
    }
  `);

  it('adds item to DynamoDB', async () => {
    const variableValues = {
      id: '1234#99',
      payload: { test: 1234 },
    };

    const res = await execute({
      document,
      variableValues,
      schema,
    });

    expect(res.data!.createSubscription).toEqual(true);

    const result = await documentClient.send(
      new GetCommand({
        TableName: config.tableNames.subscriptions,
        Key: { id: variableValues.id },
      })
    );
    expect(result.Item).toEqual(expect.objectContaining(variableValues));
  });
});

describe('on delete subscription', () => {
  const document = parse(`
    mutation DeleteSubscription($id: ID!) {
      deleteSubscription(id: $id)
    }
  `);

  it('removes item from DynamoDB', async () => {
    const variableValues = {
      id: '1234#1',
    };

    const res = await execute({
      document,
      variableValues,
      schema,
    });

    expect(res.data!.deleteSubscription).toEqual(true);

    const result = await documentClient.send(
      new GetCommand({
        TableName: config.tableNames.subscriptions,
        Key: { id: '1234' },
      })
    );
    expect(result.Item).toEqual(undefined);
  });
});

describe('on create topicSubscription', () => {
  const document = parse(`
    mutation CreateTopicSubscription($id: ID!, $payload: Object!) {
      createTopicSubscription(id: $id, payload: $payload)
    }
  `);

  it('adds item to DynamoDB', async () => {
    const variableValues = {
      id: '1234#99',
      payload: { test: 1234 },
    };

    const res = await execute({
      document,
      variableValues,
      schema,
    });
    expect(res.data!.createTopicSubscription).toEqual(true);

    const result = await documentClient.send(
      new GetCommand({
        TableName: config.tableNames.topicSubscriptions,
        Key: { id: variableValues.id },
      })
    );
    expect(result.Item).toEqual(expect.objectContaining(variableValues));
  });
});

describe('on delete topicSubscription', () => {
  const document = parse(`
    mutation DeleteTopicSubscription($id: ID!) {
      deleteTopicSubscription(id: $id)
    }
  `);

  it('removes item from DynamoDB', async () => {
    const variableValues = {
      id: '1234#1',
    };

    const res = await execute({
      document,
      variableValues,
      schema,
    });

    expect(res.data!.deleteTopicSubscription).toEqual(true);

    const result = await documentClient.send(
      new GetCommand({
        TableName: config.tableNames.topicSubscriptions,
        Key: { id: '1234' },
      })
    );
    expect(result.Item).toEqual(undefined);
  });
});
