import Connection from '~/server/Connection.ts';

export type ModuleInstance<StateType, ReducersType> = {
  actors: { [key in keyof ReducersType]: (data: any) => void };
  getState: () => StateType;
  join: (conn: Connection) => void;
  leave: (conn: Connection) => void;
};
export type GenericModuleInstance = ModuleInstance<
  unknown,
  Record<string, never>
>;

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
    return moduleInstances.get(name) as ModuleInstance<
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
      const str = JSON.stringify({ type: `${name}-${k}`, arg: action });
      connections.forEach((conn) => conn.sendText(str));
    };
  });

  const inst = {
    actors: actors as { [key in keyof ReducersType]: (data: any) => void },
    getState: () => state,
    join: (conn: Connection) => {
      if (actors.hasOwnProperty('join')) {
        actors.join(conn.uuid);
      }
      conn.sendText(JSON.stringify({ type: `${name}-reset`, arg: state }));
      connections.add(conn);
    },
    leave: (conn: Connection) => {
      connections.delete(conn);
      if (actors.hasOwnProperty('leave')) {
        actors.leave(conn.uuid);
      }
    },
  };

  moduleInstances.set(name, inst);
  return inst;
};
