export const addHours = (date: Date, hours: number) =>
  new Date(date.valueOf() + hours * 1000 * 60 * 60);
