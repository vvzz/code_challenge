import * as E from "fp-ts/Either";
import { flow, pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as C from "io-ts/Codec";
import * as D from "io-ts/Decoder";
import * as En from "io-ts/Encoder";

export const optionFromNullable = <A, O>(
  c: C.Codec<unknown, O, A>
): C.Codec<unknown, O | null, O.Option<A>> =>
  C.make(
    pipe(
      D.id<unknown>(),
      D.parse((_) =>
        pipe(
          _,
          O.fromNullable,
          O.foldW(() => D.success(O.none), flow(c.decode, E.map(O.some)))
        )
      )
    ),
    pipe(En.id<O | null>(), En.contramap(flow(O.map(c.encode), O.toNullable)))
  );
