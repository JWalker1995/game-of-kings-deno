import * as t from 'io-ts';
import * as fp from 'fp-ts';

export const makeDecoder =
  <CodecType extends t.Any>(codec: CodecType) =>
  (data: any): t.TypeOf<CodecType> =>
    fp.either.fold((err) => {
      console.error(err);
      throw new Error(JSON.stringify(err));
    }, (data) => data)(codec.decode(data));
