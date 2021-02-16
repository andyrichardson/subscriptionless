import { attribute, hashKey, table } from '@aws/dynamodb-data-mapper-annotations';
import { APIGatewayEventRequestContext } from 'aws-lambda';

@table(process.env.DYNAMODB_SUBSCRIPTIONS_TABLE)
/**
 * Connection established with `connection_init`
 */
export class GraphQLConnection {
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
