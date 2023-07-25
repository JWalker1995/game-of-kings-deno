import { serve, serveTls } from 'std-latest/http/server.ts';
import Connection from '~/server/Connection.ts';

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

const handler = async (req: Request) => {
  if (req.headers.get('upgrade') === 'websocket') {
    const { socket, response } = Deno.upgradeWebSocket(req);
    socket.binaryType = 'arraybuffer';
    const conn = new Connection((data) => socket.send(data));
    socket.addEventListener('message', (event) => {
      if (event.data instanceof ArrayBuffer) {
        conn.onData(new Uint8Array(event.data));
      }
    });
    socket.addEventListener('close', () => {
      conn.onClose();
    });
    return response;
  }

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
};

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
