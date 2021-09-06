module.exports = {
  tables: [
    {
      TableName: `connections`,
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
      data: [{ id: '1', payload: { test: 'some payload' } }],
    },
    {
      TableName: `subscriptions`,
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
      data: [{ id: '1#1' }, { id: '1#2' }],
    },
    {
      TableName: `topicSubscriptions`,
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
      data: [{ id: '1#1#1' }, { id: '1#1#2' }, { id: '1#2#1' }],
    },
  ],
  basePort: 8000,
};
