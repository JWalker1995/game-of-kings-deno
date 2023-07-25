import Connection from '~/server/Connection.ts';

export default class User {
  public connections = new Set<Connection>();

  constructor(public publicKey: Uint8Array) {}

  send(data: any) {}

  onData(data: any) {}
}
