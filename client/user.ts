import { bin2hex } from '~/common/hex.ts';
import { getIdentity } from '~/common/packet.ts';
import { hash } from '~/common/hash.ts';

export const userId = bin2hex(hash(getIdentity().publicKey));
