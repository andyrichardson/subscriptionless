import { DynamoDbTable } from '@aws/dynamodb-data-mapper';
import { attribute, hashKey, table } from '@aws/dynamodb-data-mapper-annotations';
import { APIGatewayEventRequestContext } from 'aws-lambda';

/**
 * Connection established with `connection_init`
 */
export class Connection {
  /* ConnectionID */
  @hashKey({ type: 'String' })
  id: string;

  @attribute({ defaultProvider: () => new Date() })
  createdAt: Date;

  @attribute()
  requestContext: APIGatewayEventRequestContext;

  @attribute()
  payload: Record<string, string>;
}
