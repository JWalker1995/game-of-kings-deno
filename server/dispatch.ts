import Connection from '~/server/Connection.ts';
import { makeDecoder } from '~/common/coder.ts';
import { PacketCodec, SubMsgCodec, UnsubMsgCodec } from '~/common/codecs.ts';
import { getModuleInstance } from '~/server/modules.ts';

const packetDecoder = makeDecoder(PacketCodec);
const subDecoder = makeDecoder(SubMsgCodec);
const unsubDecoder = makeDecoder(UnsubMsgCodec);

const dispatchers: { [key: string]: (conn: Connection, arg: any) => void } = {
  sub(conn: Connection, arg: any) {
    const name = subDecoder(arg);
    const mod = getModuleInstance(name);
    mod.join(conn);
    conn.modules.add(mod);
  },

  unsub(conn: Connection, arg: any) {
    const name = unsubDecoder(arg);
    const mod = getModuleInstance(name);
    conn.modules.delete(mod);
    mod.leave(conn);
  },
};

export const dispatch = (conn: Connection, msg: any) => {
  const { type, arg } = packetDecoder(msg);
  dispatchers[type]?.call(null, conn, arg);
};
