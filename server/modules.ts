// import { makeDecoder, SubMsgCodec, UnsubMsgCodec } from 'game-of-kings-common';

import { makeDecoder } from '~/common/coder.ts';
import { SubMsgCodec, UnsubMsgCodec } from '~/common/codecs.ts';
import Connection from '~/server/Connection.ts';

export type ModuleInstance<StateType, ReducersType> = {
  actors: { [key in keyof ReducersType]: (data: any) => void };
  getState: () => StateType;
  join: (conn: Connection) => void;
  leave: (conn: Connection) => void;
};
export type GenericModuleInstance = ModuleInstance<any, Record<string, never>>;

const moduleInstances = new Map<string, GenericModuleInstance>();

export const getModuleInstance = <
  StateType,
  ReducersType extends Record<
    string,
    (state: StateType, action: any) => StateType
  >,
>(
  name: string,
  defn: {
    initialState: StateType;
    reducers: ReducersType;
  },
): ModuleInstance<StateType, ReducersType> => {
  if (moduleInstances.has(name)) {
    return moduleInstances.get(name) as (ModuleInstance<
      StateType,
      ReducersType
    >);
  } else {
    throw new Error(`Module ${name} does not exist`);
  }
};

export const createModuleInstance = <
  StateType,
  ReducersType extends Record<
    string,
    (state: StateType, action: any) => StateType
  >,
>(
  name: string,
  defn: {
    initialState: StateType;
    reducers: ReducersType;
  },
): ModuleInstance<StateType, ReducersType> => {
  if (moduleInstances.has(name)) {
    return moduleInstances.get(name)! as ModuleInstance<
      StateType,
      ReducersType
    >;
  }

  let state: StateType = defn.initialState;
  const actors: Record<string, (action: any) => void> = {};
  const connections = new Set<Connection>();

  Object.entries(defn.reducers).forEach(([k, reducer]) => {
    actors[k] = (action: any) => {
      state = reducer(state, action);
      const serialization = new TextEncoder().encode(
        JSON.stringify({ key: `${name}-${k}`, arg: action }),
      );
      connections.forEach((conn) => conn.sendData(serialization));
    };
  });

  const inst = {
    actors: actors as { [key in keyof ReducersType]: (data: any) => void },
    getState: () => state,
    join: (conn: Connection) => {
      if (actors.hasOwnProperty('join')) {
        actors.join(conn.uuid);
      }
      const serialization = new TextEncoder().encode(
        JSON.stringify({ key: `${name}-reset`, arg: state }),
      );
      conn.sendData(serialization);
    },
    leave: (conn: Connection) => {
      if (actors.hasOwnProperty('leave')) {
        actors.leave(conn.uuid);
      }
    },
  };

  moduleInstances.set(name, inst);
  return inst;
};

io.on('connection', (socket) => {
  console.log(`Socket with id ${socket.id} just connected`);

  const userId = socket.handshake.auth.userId;

  // Gotta block joining/leaving rooms due to https://github.com/socketio/socket.io/issues/3562
  let roomPromise: Promise<void> = Promise.resolve();

  const subDecoder = makeDecoder(SubMsgCodec);
  socket.on('sub', async (data: any) => {
    const name = subDecoder(data);

    const inst = await getModuleInstance(name, {
      initialState: {},
      reducers: {},
    });

    roomPromise = roomPromise.then(() => {
      if (!socket.rooms.hasOwnProperty(name)) {
        return new Promise((resolve) =>
          socket.join(name, () => {
            inst.join(userId);
            socket.emit(`${name}-reset`, inst.getState());

            resolve();
          })
        );
      }
    });
  });

  const unsubDecoder = makeDecoder(UnsubMsgCodec);
  socket.on('unsub', async (data: any) => {
    const name = unsubDecoder(data);

    const inst = await getModuleInstance(name, {
      initialState: {},
      reducers: {},
    });

    roomPromise = roomPromise.then(() => {
      if (socket.rooms.hasOwnProperty(name)) {
        return new Promise((resolve) =>
          socket.leave(name, () => {
            inst.leave(userId);

            resolve();
          })
        );
      }
    });
  });

  socket.on('disconnecting', (reason) => {
    Object.keys(socket.rooms).forEach(async (name) => {
      const inst = await getModuleInstance(name, {
        initialState: {},
        reducers: {},
      });

      inst.leave(userId);
    });
  });
});
