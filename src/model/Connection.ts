import { attribute, hashKey } from '@aws/dynamodb-data-mapper-annotations';
import { APIGatewayEventRequestContext } from 'aws-lambda';
import { addHours } from '../utils';

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

  /** has a pong been returned */
  @attribute({ defaultProvider: () => false })
  hasPonged: boolean;

  @attribute({ defaultProvider: () => addHours(new Date(), 3) })
  ttl: Date;
}
