export const SIGNATURE_LENGTH = 64;

export enum MessageType {
  Identify,
  Rename,
}

export interface ClientCtx {
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  nonce: number;
}
export interface ServerCtx {
  publicKey?: CryptoKey;
  nonce: number;
}

const keyParams = {
  name: 'ECDSA',
  namedCurve: 'P-256',
  hash: { name: 'SHA-256' },
};

export const createIdentity = async (): Promise<ClientCtx> => ({
  ...await crypto.subtle.generateKey(keyParams, true, ['sign']),
  nonce: Date.now(),
});
export const serializeIdentity = async (ctx: ClientCtx) =>
  JSON.stringify({
    privateKey: await crypto.subtle.exportKey('jwk', ctx.privateKey),
    publicKey: await crypto.subtle.exportKey('jwk', ctx.publicKey),
    nonce: ctx.nonce,
  });
export const deserializeIdentity = async (
  serialization: string,
): Promise<ClientCtx> => {
  const { privateKey, publicKey, nonce } = JSON.parse(serialization);
  return {
    privateKey: await crypto.subtle.importKey(
      'jwk',
      privateKey,
      keyParams,
      true,
      ['sign'],
    ),
    publicKey: await crypto.subtle.importKey(
      'jwk',
      publicKey,
      keyParams,
      true,
      ['sign'],
    ),
    nonce,
  };
};

export const encode = async (
  typeIdx: MessageType,
  msg: any,
  ctx: ClientCtx,
) => {
  // TODO: Use ctx.nonce to prevent replay/reorder attacks

  const isIdentify = typeIdx === MessageType.Identify;

  const dataBuf = isIdentify
    ? new Uint8Array(await crypto.subtle.exportKey('raw', ctx.publicKey))
    : new TextEncoder().encode(JSON.stringify(msg));
  const buf = new Uint8Array(SIGNATURE_LENGTH + 1 + dataBuf.byteLength);
  buf[SIGNATURE_LENGTH] = typeIdx;
  buf.set(dataBuf, SIGNATURE_LENGTH + 1);

  const sig = await crypto.subtle.sign(
    keyParams,
    ctx.privateKey,
    buf.subarray(SIGNATURE_LENGTH),
  );

  if (sig.byteLength !== SIGNATURE_LENGTH) {
    throw new Error(`Internal error: Unexpected signature length!`);
  }
  buf.set(new Uint8Array(sig), 0);

  return buf;
};

export const decode = async (buf: Uint8Array, ctx: ServerCtx) => {
  const isIdentify = buf[SIGNATURE_LENGTH] === MessageType.Identify;

  const pubKey = isIdentify
    ? await crypto.subtle.importKey(
      'raw',
      buf.subarray(SIGNATURE_LENGTH + 1),
      keyParams,
      true,
      ['verify'],
    )
    : ctx.publicKey;
  if (!pubKey) {
    throw new Error(`Cannot verify with no public key!`);
  }

  const valid = await crypto.subtle.verify(
    { name: 'ECDSA', hash: { name: 'SHA-256' } },
    pubKey,
    buf.subarray(0, SIGNATURE_LENGTH),
    buf.subarray(SIGNATURE_LENGTH),
  );

  if (!valid) {
    throw new Error(`Invalid signature!`);
  }

  if (isIdentify) {
    ctx.publicKey = pubKey;
  }

  return {
    typeIdx: buf[SIGNATURE_LENGTH] as MessageType,
    msg: isIdentify ? null : JSON.parse(
      new TextDecoder().decode(buf.subarray(SIGNATURE_LENGTH + 1)),
    ),
  };
};
