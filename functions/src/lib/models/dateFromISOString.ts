import { pipe } from "fp-ts/function";
import * as C from "io-ts/Codec";
import * as D from "io-ts/Decoder";
import * as En from "io-ts/Encoder";

export const dateFromISOString = C.make(
  C.fromDecoder(
    pipe(
      D.string,
      D.map(decodeURIComponent),
      D.parse((s) => {
        const d = new Date(s);
        return !Number.isNaN(d.getTime())
          ? D.success(d)
          : D.failure(s, "Date encoded as ISO8601 string");
      })
    )
  ),
  pipe(
    En.id<string>(),
    En.contramap((_: Date) => _.toISOString())
  )
);
