import { pipe } from "fp-ts/function";
import * as C from "io-ts/Codec";

export const FilterParamsModel = pipe(
  C.partial({
    active: C.boolean,
  })
);
export type FilterParams = C.TypeOf<typeof FilterParamsModel>;
