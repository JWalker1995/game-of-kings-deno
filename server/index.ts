import Connection from '~/server/Connection.ts';
import { updateDns } from '~/server/updateDns.ts';

const serverRestartInterval = 1000 * 60 * 60 * 24 * 7 * 0.7;

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
const protocol = useHttps ? 'https:' : 'http:';
const prefixes = [
  mainPort === 80
    ? `${protocol}//localhost/`
    : `${protocol}//localhost:${mainPort}/`,
  `${protocol}//gameofkings.io/`,
];

if (Deno.env.has('DYNDNS_USERNAME') || Deno.env.has('DYNDNS_PASSWORD')) {
  await updateDns({
    username: getEnvVar('DYNDNS_USERNAME'),
    password: getEnvVar('DYNDNS_PASSWORD'),
  });
  console.log('Updated dynamic dns!');
}

const handler = async (req: Request) => {
  if (req.headers.get('upgrade') === 'websocket') {
    const { socket, response } = Deno.upgradeWebSocket(req);
    socket.binaryType = 'arraybuffer';
    const conn = new Connection((data) => socket.send(data));
    socket.addEventListener('message', (event) => {
      try {
        if (event.data instanceof ArrayBuffer) {
          conn.onBinary(new Uint8Array(event.data));
        } else if (typeof event.data === 'string') {
          conn.onText(event.data);
        }
      } catch (err) {
        console.error(err);
      }
    });
    socket.addEventListener('close', () => {
      conn.onClose();
    });
    return response;
  }

  if (!prefixes.some((pfx) => req.url.startsWith(pfx))) {
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

while (true) {
  const restartController = new AbortController();
  setTimeout(() => restartController.abort(), serverRestartInterval);

  if (useHttps) {
    const mainServer = Deno.serve({
      handler,
      port: mainPort,
      signal: restartController.signal,

      key: await Deno.readTextFile(
        '/etc/letsencrypt/live/gameofkings.io/privkey.pem',
      ),
      cert: await Deno.readTextFile(
        '/etc/letsencrypt/live/gameofkings.io/cert.pem',
      ),
      // caFile:'/etc/letsencrypt/live/gameofkings.io/chain.pem',
    });

    const upgradeServer = Deno.serve({
      handler: (req) =>
        new Response(null, {
          status: 301,
          headers: {
            Location: 'https://' + req.headers.get('Host') + req.url,
          },
        }),
      port: parseInt(getEnvVar('HTTP_PORT')),
      signal: restartController.signal,
    });

    await Promise.all([mainServer.finished, upgradeServer.finished]);
  } else {
    const server = Deno.serve({
      handler,
      port: mainPort,
      signal: restartController.signal,
    });
    await server.finished;
  }
}
