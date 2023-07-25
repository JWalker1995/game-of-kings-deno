import { serve, serveTls } from 'std-latest/http/server.ts';
import { Server } from 'socketio-server';
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from '~/common/protocol.ts';

const getEnvVar = (key: string) => {
  const val = Deno.env.get(key);
  if (!val) {
    throw new Error(`Must specify a ${key} env var`);
  }
  return val;
};

const useHttps = parseInt(getEnvVar('USE_HTTPS'));
const staticDir = getEnvVar('STATIC_DIR');
const mainPort = parseInt(
  useHttps ? getEnvVar('HTTPS_PORT') : getEnvVar('HTTP_PORT'),
);
const urlPrefix = useHttps
  ? `https://gameofkings.io/`
  : `http://localhost:${mainPort}/`;

export const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>();

io.on('connection', (socket) => {
  console.log(`socket ${socket.id} connected`);

  socket.emit('noArg');

  socket.on('disconnect', (reason) => {
    console.log(`socket ${socket.id} disconnected due to ${reason}`);
  });
});

const handler = io.handler(async (req) => {
  if (!req.url.startsWith(urlPrefix)) {
    console.error(`Discarding request to url ${req.url}`);
    return new Response(null, { status: 404 });
  }

  let path = staticDir + (new URL(req.url)).pathname;
  if (path.endsWith('/')) {
    path += 'index.html';
  }

  try {
    const file = await Deno.open(path, { read: true });
    return new Response(file.readable);
  } catch {
    console.error(`Can't open file ${path}`);
    return new Response(null, { status: 404 });
  }
});

if (useHttps) {
  await Promise.all([
    serveTls(handler, {
      port: mainPort,

      // TODO: Update these every day or so, so we get letsencrypt's key rotations
      keyFile: '/etc/letsencrypt/live/gameofkings.io/privkey.pem',
      certFile: '/etc/letsencrypt/live/gameofkings.io/cert.pem',
      // caFile:'/etc/letsencrypt/live/gameofkings.io/chain.pem',
    }),

    serve((req) =>
      new Response(null, {
        status: 301,
        headers: {
          Location: 'https://' + req.headers.get('Host') + req.url,
        },
      }), {
      port: parseInt(getEnvVar('HTTP_PORT')),
    }),
  ]);
} else {
  await serve(handler, {
    port: mainPort,
  });
}
