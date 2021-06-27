import { DynamoDbTable } from '@aws/dynamodb-data-mapper';
import { Class } from '../types';

export * from './Connection';
export * from './Subscription';

export const assign: <T>(model: T, properties: Partial<T>) => T = Object.assign;

export const createModel = <T extends Class>({
  model,
  table,
}: {
  table: string;
  model: T;
}) => {
  Object.defineProperties(model.prototype, {
    [DynamoDbTable]: { value: table },
  });
  return model;
};
