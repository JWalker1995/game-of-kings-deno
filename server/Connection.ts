import User from '~/server/User.ts';
import { decode, VerifierCtx } from '~/common/packet.ts';
import { bin2hex } from '~/common/hex.ts';
import { users } from '~/server/registries.ts';

export default class Connection {
  public uuid = crypto.randomUUID();

  private user?: User;
  private ctx: VerifierCtx = { nonce: Date.now() };

  constructor(public sendData: (data: Uint8Array) => void) {}

  public onData(buf: Uint8Array) {
    const res = decode(buf, this.ctx);
    if ('identity' in res) {
      const key = bin2hex(res.identity);
      this.user = users.get(key);
      if (this.user === undefined) {
        this.user = new User(res.identity);
        users.set(key, this.user);
      }
      this.user.connections.add(this);
    } else {
      this.user?.recv(res.type, res.msg);
    }
  }

  public onClose() {
    this.user?.connections.delete(this);
  }
}
