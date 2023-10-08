import * as C from "io-ts/Codec";

export const APISuccessModel = <O, A>(c: C.Codec<unknown, O, A>) =>
  C.struct({
    status: C.literal("success"),
    data: c,
  });
export type APISuccess<T> = {
  status: "success";
  data: T;
};
export const getData = <T>(as: APISuccess<T>) => as.data;
