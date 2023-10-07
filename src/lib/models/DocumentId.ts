import * as C from "io-ts/Codec";

export const DocumentId = C.struct({
  id: C.string,
});
