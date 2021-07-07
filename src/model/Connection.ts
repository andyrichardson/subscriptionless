import { attribute, hashKey } from '@aws/dynamodb-data-mapper-annotations';
import { APIGatewayEventRequestContext } from 'aws-lambda';

/**
 * Connection established with `connection_init`
 */
export class Connection {
  /* ConnectionID */
  @hashKey({ type: 'String' })
  id: string;

  /** Time of creation */
  @attribute({ defaultProvider: () => new Date() })
  createdAt: Date;

  /** Request context from $connect event */
  @attribute()
  requestContext: APIGatewayEventRequestContext;

  /** connection_init payload (post-parse) */
  @attribute()
  payload: Record<string, string>;

  /** Step function arn */
  @attribute()
  pingerInvocation: string;

  /** has a pong been returned */
  @attribute({ defaultProvider: () => false })
  hasPonged: boolean;
}
