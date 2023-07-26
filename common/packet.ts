import { Sha3_256 } from 'https://deno.land/std@0.160.0/hash/sha3.ts';
import secp from '../common/secp.ts';
import { bin2hex, hex2bin } from '~/common/hex.ts';

export const SIGNATURE_LENGTH = 64;

export enum MessageType {
  Null,
  Event,
  Identify = 255,
}

export interface SignerCtx {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  nonce: number;
}
export interface VerifierCtx {
  publicKey?: Uint8Array;
  nonce: number;
}

const hash = (data: Uint8Array) => {
  const algo = new Sha3_256();
  algo.update(data);
  return new Uint8Array(algo.digest());
};

const getPrivateKey = (): Uint8Array => {
  const pkid = new URLSearchParams(window.location?.search).get('pkid') || '';
  const hex = localStorage.getItem(`gok_pk_${pkid}`);
  if (hex) {
    return hex2bin(hex);
  } else {
    const key = secp.utils.randomPrivateKey();
    localStorage.setItem(`gok_pk_${pkid}`, bin2hex(key));
    return key;
  }
};

export const getIdentity = (): SignerCtx => {
  const privateKey = getPrivateKey();
  return {
    privateKey,
    publicKey: secp.getPublicKey(privateKey),
    nonce: Date.now(),
  };
};

export const encode = (type: MessageType, msg: any, ctx: SignerCtx) => {
  const data = new TextEncoder().encode(JSON.stringify(msg));
  return sign(type, data, ctx);
};
export const encodeIdentify = (ctx: SignerCtx) => {
  return sign(MessageType.Identify, ctx.publicKey, ctx);
};
const sign = (type: MessageType, data: Uint8Array, ctx: SignerCtx) => {
  // TODO: Use ctx.nonce to prevent replay/reorder attacks

  const buf = new Uint8Array(SIGNATURE_LENGTH + 1 + data.byteLength);
  buf[SIGNATURE_LENGTH] = type;
  buf.set(data, SIGNATURE_LENGTH + 1);

  const sig = secp.sign(
    hash(buf.subarray(SIGNATURE_LENGTH)),
    ctx.privateKey,
    { lowS: true, extraEntropy: secp.etc.randomBytes(32) },
  ).toCompactRawBytes();
  if (sig.byteLength !== SIGNATURE_LENGTH) {
    throw new Error(`Internal error: Unexpected signature length!`);
  }
  buf.set(sig, 0);

  return buf;
};

export const decode = (
  buf: Uint8Array,
  ctx: VerifierCtx,
): { identity: Uint8Array } | { type: MessageType; msg: any } => {
  const isIdentify = buf[SIGNATURE_LENGTH] === MessageType.Identify;

  const pubKey = isIdentify
    ? buf.subarray(SIGNATURE_LENGTH + 1)
    : ctx.publicKey;
  if (!pubKey) {
    throw new Error(`Cannot verify with no public key!`);
  }

  const valid = secp.verify(
    buf.subarray(0, SIGNATURE_LENGTH),
    hash(buf.subarray(SIGNATURE_LENGTH)),
    pubKey,
  );
  if (!valid) {
    throw new Error(`Invalid signature!`);
  }

  if (isIdentify) {
    ctx.publicKey = pubKey;
    return { identity: pubKey };
  } else {
    return {
      type: buf[SIGNATURE_LENGTH] as MessageType,
      msg: JSON.parse(
        new TextDecoder().decode(buf.subarray(SIGNATURE_LENGTH + 1)),
      ),
    };
  }
};
