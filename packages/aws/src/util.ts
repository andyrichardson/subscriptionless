export const addHours = (date: Date, hours: number) =>
  new Date(date.valueOf() + hours * 1000 * 60 * 60);

export const getUnixTime = (date: Date) => (date.getTime() / 1000) | 0;
