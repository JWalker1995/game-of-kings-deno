import { Sha3_256 } from 'https://deno.land/std@0.160.0/hash/sha3.ts';

export const hash = (data: Uint8Array) => {
  const algo = new Sha3_256();
  algo.update(data);
  return new Uint8Array(algo.digest());
};
