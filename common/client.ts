import { encodeIdentify, getIdentity } from '~/common/packet.ts';

const identity = getIdentity();

export const connect = () => {
  // let backoff = 1000;
  const buffer: (string | Uint8Array)[] = [];
  const listeners = new Map<string, Set<(arg: any) => void>>();

  const url = new URL(window.location.origin);
  url.protocol = { 'http:': 'ws', 'https:': 'wss' }[url.protocol]!;

  let socket: WebSocket;
  (async () => {
    while (true) {
      socket = new WebSocket(url);
      socket.binaryType = 'arraybuffer';
      socket.addEventListener('open', () => {
        socket.send(encodeIdentify(identity));
        buffer.forEach((data) => socket.send(data));
        buffer.length = 0;
      });
      socket.addEventListener('error', (e) => console.error(e));

      socket.addEventListener('message', (e) => {
        const { type, arg } = JSON.parse(e.data);
        listeners.get(type)?.forEach((cb) => cb(arg));
      });

      await new Promise((resolve) => socket.addEventListener('close', resolve));
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  })();

  const send = (data: string | Uint8Array) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(data);
    } else {
      buffer.push(data);
    }
  };

  const modules = new Map<
    string,
    {
      defn: {
        initialState: any;
        reducers: Record<string, (state: any, action: any) => any>;
      };
      state: any;
      listeners: ((state: any) => void)[];
      unsub: () => void;
    }
  >();

  const onModuleUpdate = <StateType>(
    name: string,
    defn: {
      initialState: StateType;
      reducers: Record<string, (state: StateType, action: any) => StateType>;
    },
    callback: (state: StateType) => void,
  ) => {
    let mod = modules.get(name);
    if (mod) {
      if (defn !== mod.defn) {
        throw new Error(
          `Two useModule calls with same name ${name} have different definitions!`,
        );
      }
      mod.listeners.push(callback);
    } else {
      mod = {
        defn,
        state: defn.initialState,
        listeners: [callback],
        unsub: () => unsubs.forEach((cb) => cb()),
      };
      modules.set(name, mod);

      let hadReset = false;

      const unsubs = [
        () => {
          send(JSON.stringify({ type: 'unsub', arg: name }));
        },
      ].concat(
        Object.entries(defn.reducers).map(([k, reducer]) => {
          const eventType = `${name}-${k}`;

          const cb = (action: any) => {
            console.log(
              name,
              k,
              !hadReset && k !== 'reset' ? 'dropped' : 'kept',
            );
            if (!hadReset) {
              if (k === 'reset') {
                hadReset = true;
              } else {
                return;
              }
            }

            if (!mod) {
              throw new Error('Something went very wrong');
            }

            mod.state = reducer(mod.state, action);
            mod.listeners.forEach((setter) => setter(mod!.state));
          };

          let l = listeners.get(eventType);
          if (l === undefined) {
            l = new Set();
            listeners.set(eventType, l);
          }
          l.add(cb);
          return () => {
            l!.delete(cb);
          };
        }),
      );

      send(JSON.stringify({ type: 'sub', arg: name }));
    }

    callback(mod.state);

    return () => {
      if (!mod) {
        throw new Error('Something went very wrong');
      }

      const index = mod.listeners.indexOf(callback);
      if (index === -1) {
        throw new Error(`Callback doesn't exist in listener list!`);
      }
      mod.listeners.splice(index, 1);
      if (mod.listeners.length === 0) {
        modules.delete(name);
        mod.unsub();
      }
    };
  };

  return { send, onModuleUpdate };
};
