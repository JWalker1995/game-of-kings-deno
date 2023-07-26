import Connection from '~/server/Connection.ts';

export abstract class Room {
  private messages: Uint8Array[] = [];
  private connections = new Set<Connection>();

  public join(conn: Connection) {
    this.connections.add(conn);
    this.messages.forEach((data) => conn.sendData(data));
  }

  public leave(conn: Connection) {
    this.connections.delete(conn);
  }

  public broadcast(key: string, msg: any) {
    this.reduce(key, msg);

    const data = new TextEncoder().encode(JSON.stringify({ key, msg }));
    this.connections.forEach((conn) => conn.sendData(data));
    this.messages.push(data);
  }

  protected abstract reduce(key: string, msg: any): void;
}

export class RoomImpl<StateType> extends Room {
  private state: StateType;
  private reducers: {
    [key: string]: (state: StateType, action: any) => StateType;
  };

  constructor(mod: {
    initialState: StateType;
    reducers: { [key: string]: (state: StateType, action: any) => StateType };
  }) {
    super();

    this.state = mod.initialState;
    this.reducers = mod.reducers;
  }

  protected reduce(key: string, msg: any) {
    if (!Object.prototype.hasOwnProperty.call(this.reducers, key)) {
      throw new Error(`No reducer for key ${key}!`);
    }
    this.state = this.reducers[key](this.state, msg);
  }
}
