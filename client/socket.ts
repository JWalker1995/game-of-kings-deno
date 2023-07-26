import React from 'react';

import { connect } from '~/common/client.ts';

const conn = connect();

export const send = (type: string, arg: any) =>
  conn.send(JSON.stringify({ type, arg }));

export const useModule = <StateType>(
  name: string,
  defn: {
    initialState: StateType;
    reducers: Record<string, (state: StateType, action: any) => StateType>;
  },
) => {
  const [state, setState] = React.useState<StateType>(defn.initialState);

  React.useEffect(() => {
    console.log(`Restarting state for ${name}`);
    return conn.onModuleUpdate(name, defn, setState);
  }, [name, defn]);

  return state;
};

export const useLatency = () => {
  const [latency, setLatency] = React.useState<number | undefined>(undefined);

  // React.useEffect(() => {
  //   conn.socket.on('pong', setLatency);
  //   return () => {
  //     conn.socket.off('pong', setLatency);
  //   };
  // }, []);

  return latency;
};
