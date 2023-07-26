import Connection from '~/server/Connection.ts';
import { encode, MessageType } from '~/common/packet.ts';
import { serverCtx } from '~/server/serverCtx.ts';

export default class User {
  public connections = new Set<Connection>();

  constructor(public publicKey: Uint8Array) {}

  public broadcast(type: MessageType, msg: any) {
    if (this.connections.size === 0) {
      return;
    }
    const data = encode(type, msg, serverCtx);
    this.connections.forEach((conn) => conn.sendData(data));
  }

  public recv(type: MessageType, msg: any) {}
}
