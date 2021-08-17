export const isAsyncIterable = <T>(arg: any): arg is AsyncIterable<T> =>
  arg !== null &&
  typeof arg == 'object' &&
  typeof arg[Symbol.asyncIterator] === 'function';
