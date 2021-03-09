import { attribute, hashKey, rangeKey } from '@aws/dynamodb-data-mapper-annotations';
import { APIGatewayEventRequestContext } from 'aws-lambda';

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

  @attribute({ type: 'String', indexKeyConfigurations: { 'connectionIndex': 'HASH' } })
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
