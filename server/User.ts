import Connection from '~/server/Connection.ts';

export default class User {
  public connections = new Set<Connection>();

  constructor(public publicKey: Uint8Array) {}

  public broadcast(msg: any) {
    // if (this.connections.size === 0) {
    //   return;
    // }
    // const data = encode(type, msg, serverCtx);
    // this.connections.forEach((conn) => conn.sendData(data));
  }

  public recv(conn: Connection, msg: any) {
  }
}
