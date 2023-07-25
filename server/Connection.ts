import User from '~/server/User.ts';

export default class Connection {
  private user?: User;

  constructor(private send: (data: Uint8Array) => void) {}

  onData(buf: Uint8Array) {}

  onClose() {
    if (this.user) {
      this.user.connections.delete(this);
    }
  }
}
