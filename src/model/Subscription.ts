import { DynamoDbTable } from '@aws/dynamodb-data-mapper';
import { attribute, hashKey, rangeKey } from '@aws/dynamodb-data-mapper-annotations';
import { APIGatewayEventRequestContext } from 'aws-lambda';
import { prototype } from 'aws-sdk/clients/dynamodb';

/**
 * Active subscriptions
 */
export class Subscription {
  /*
   * connectionId|subscriptionId|topic
   */
  @hashKey({ type: 'String' })
  id: string;

  @rangeKey({
    type: 'String',
  })
  topic: string;

  @attribute()
  filter: object;

  @attribute({ type: 'String' })
  connectionId: string;

  @attribute({ type: 'String' })
  subscriptionId: string;

  @attribute({ defaultProvider: () => new Date() })
  createdAt: Date;

  @attribute()
  requestContext: APIGatewayEventRequestContext;

  @attribute()
  subscription: {
    query: string;
    /** Actual value of variables for given field */
    variables?: any;
    /** Value of variables for user provided subscription */
    variableValues?: any;
    operationName?: string | null;
  };
}
