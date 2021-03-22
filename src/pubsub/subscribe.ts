import {
  SubscribeArgs,
  SubscribeHandler,
  SubscribePsuedoIterable,
  SubscriptionDefinition,
} from '../types';

/** Creates subscribe handler */
export const subscribe = (topic: string) => (...args: SubscribeArgs) =>
  createHandler({ definitions: [{ topic }] });

/** Add filter to subscribe handler */
export const withFilter = (
  handler: SubscribeHandler,
  filter: object | ((...args: SubscribeArgs) => object)
) => (...args: SubscribeArgs) => {
  const iterable = handler(...args);
  if (iterable.definitions.length !== 1) {
    throw Error("Cannot call 'withFilter' on invalid type");
  }

  return createHandler({
    definitions: [
      {
        ...iterable.definitions[0],
        filter: typeof filter === 'function' ? filter(...args) : filter,
      },
    ],
  });
};

/** Merge multiple subscribe handlers */
export const concat = (...handlers: SubscribeHandler[]) => (
  ...args: SubscribeArgs
) =>
  createHandler({
    definitions: handlers.map((h) => h(...args).definitions).flat(),
  });

const createHandler = (arg: { definitions: SubscriptionDefinition[] }) => {
  const h: SubscribePsuedoIterable = (() => {
    throw Error('Subscription handler should not have been called');
  }) as any;
  h.definitions = arg.definitions;
  return h;
};
