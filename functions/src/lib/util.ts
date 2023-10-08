import * as D from "io-ts/Decoder";
import { DecodeError } from "io-ts/Decoder";

export const drawCodecErrors = (e: DecodeError) => new Error(D.draw(e));
