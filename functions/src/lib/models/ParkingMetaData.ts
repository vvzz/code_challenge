import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as C from "io-ts/Codec";
import { dateFromISOString } from "./dateFromISOString";
import { optionFromNullable } from "./optionFromNullable";

export const ParkingMetaDataModel = C.struct({
  color: optionFromNullable(C.string),
  make: optionFromNullable(C.string),
  model: optionFromNullable(C.string),
  licensePlate: C.struct({
    state: C.string,
    number: C.string,
  }),
});
export type ParkingMetadata = C.TypeOf<typeof ParkingMetaDataModel>;

export const TimeoutModel = C.struct({
  timeOut: optionFromNullable(C.fromDecoder(dateFromISOString)),
});
export const ParkingSessionModel = pipe(
  C.struct({
    timeIn: C.fromDecoder(dateFromISOString),
    metadata: optionFromNullable(ParkingMetaDataModel),
  }),
  C.intersect(TimeoutModel)
);

export type ParkingSession = C.TypeOf<typeof ParkingSessionModel>;
export const endSession = (now: Date) => ({
  timeOut: pipe(now, O.some),
});

export const startSession = (now: Date): ParkingSession => ({
  timeIn: now,
  timeOut: O.none,
  metadata: O.none,
});

export const setMetadata =
  (metaData: ParkingMetadata) =>
  (parkingSession: ParkingSession): ParkingSession => ({
    ...parkingSession,
    metadata: O.some(metaData),
  });

export const isActive = (parkingSession: ParkingSession) =>
  O.isNone(parkingSession.timeOut);
