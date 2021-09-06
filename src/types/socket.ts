import { Message } from 'graphql-ws';

export type Socket = (id: string) => {
  id: string;
  sendMessage: (arg: { message: Message }) => void;
  close: ({ error: string }) => void;
};
