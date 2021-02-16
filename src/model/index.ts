export * from './Connection';
export * from './Subscription';

export const assign: <T>(model: T, properties: Partial<T>) => T = Object.assign;