import User from '~/server/User.ts';
import { decodeIdentify, VerifierCtx } from '~/common/packet.ts';
import { bin2hex } from '~/common/hex.ts';
import { users } from '~/server/registries.ts';
import { dispatch } from '~/server/dispatch.ts';
import { GenericModuleInstance } from '~/server/modules.ts';

export default class Connection {
  public uuid = crypto.randomUUID();

  private user?: User;
  private ctx: VerifierCtx = {};

  public modules = new Set<GenericModuleInstance>();

  constructor(public sendText: (str: string) => void) {
    // TODO: Send UUID as challenge for client to sign
  }

  public getUser() {
    return this.user;
  }

  public onBinary(buf: Uint8Array) {
    const identity = decodeIdentify(buf, this.ctx);
    const key = bin2hex(identity);
    this.user = users.get(key);
    if (this.user === undefined) {
      this.user = new User(identity);
      users.set(key, this.user);
    }
    this.user.connections.add(this);
  }

  public onText(str: string) {
    dispatch(this, JSON.parse(str));
  }

  public onClose() {
    this.user?.connections.delete(this);
    this.modules.forEach((mod) => mod.leave(this));
  }
}
