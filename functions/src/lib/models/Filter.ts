import { pipe } from "fp-ts/function";
import * as C from "io-ts/Codec";
import { optionFromNullable } from "lib/models/optionFromNullable";

export const FilterModel = pipe(
  C.struct({
    pageSize: optionFromNullable(C.number),
    start: optionFromNullable(C.number),
  })
);
export type Filter = C.TypeOf<typeof FilterModel>;