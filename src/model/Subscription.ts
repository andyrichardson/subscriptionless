import {
  attribute,
  hashKey,
  rangeKey,
} from '@aws/dynamodb-data-mapper-annotations';
import { addHours } from '../utils';
import { APIGatewayWebSocketRequestContext } from '../types';

/**
 * Active subscriptions
 */
export class Subscription {
  /*
   * connectionId|subscriptionId
   */
  @hashKey({ type: 'String' })
  id: string;

  @rangeKey({
    type: 'String',
    indexKeyConfigurations: { TopicIndex: 'HASH' },
  })
  topic: string;

  @attribute()
  filter: object;

  @attribute({
    type: 'String',
    indexKeyConfigurations: { ConnectionIndex: 'HASH' },
  })
  connectionId: string;

  @attribute({ type: 'String' })
  subscriptionId: string;

  @attribute({ defaultProvider: () => new Date() })
  createdAt: Date;

  /** Redundant copy of connection_init payload */
  @attribute()
  connectionParams: object;

  @attribute()
  requestContext: APIGatewayWebSocketRequestContext;

  @attribute()
  subscription: {
    query: string;
    /** Actual value of variables for given field */
    variables?: any;
    /** Value of variables for user provided subscription */
    variableValues?: any;
    operationName?: string | null;
  };

  @attribute({ defaultProvider: () => addHours(new Date(), 3) })
  ttl: Date;
}
