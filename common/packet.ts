import { Sha3_256 } from 'https://deno.land/std@0.160.0/hash/sha3.ts';
import secp from '../common/secp.ts';
import { bin2hex, hex2bin } from '~/common/hex.ts';

export const SIGNATURE_LENGTH = 64;

export interface SignerCtx {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}
export interface VerifierCtx {
  publicKey?: Uint8Array;
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
  };
};

export const encodeIdentify = (ctx: SignerCtx) => {
  // TODO: Prevent replay attacks

  const buf = new Uint8Array(SIGNATURE_LENGTH + ctx.publicKey.byteLength);
  const sig = secp.sign(
    hash(ctx.publicKey),
    ctx.privateKey,
    { lowS: true, extraEntropy: secp.etc.randomBytes(32) },
  ).toCompactRawBytes();
  if (sig.byteLength !== SIGNATURE_LENGTH) {
    throw new Error(`Internal error: Unexpected signature length!`);
  }
  buf.set(sig, 0);
  buf.set(ctx.publicKey, SIGNATURE_LENGTH);

  return buf;
};

export const decodeIdentify = (
  buf: Uint8Array,
  ctx: VerifierCtx,
): Uint8Array => {
  const pubKey = buf.subarray(SIGNATURE_LENGTH);
  const valid = secp.verify(
    buf.subarray(0, SIGNATURE_LENGTH),
    hash(pubKey),
    pubKey,
  );
  if (!valid) {
    throw new Error(`Invalid signature!`);
  }

  ctx.publicKey = pubKey;
  return pubKey;
};
