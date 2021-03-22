export const promisify = async <T extends Function>(arg: T) => await arg();
