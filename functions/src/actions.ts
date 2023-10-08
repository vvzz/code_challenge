import { sequenceT } from "fp-ts/Apply";
import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import {
  FunctionContext,
  handleCloudFunctionError,
  handleCloudFunctionSuccess,
} from "./lib/cloudFunction";
import {
  createParkingSessionInFireStore,
  getSessionFromFirestore,
  listSessionsFromFirestore,
  updateSessionInFirestore,
} from "./lib/firestore";
import { DocumentId } from "./lib/models/DocumentId";
import { FilterModel } from "./lib/models/Filter";
import {
  endSession,
  ParkingMetaDataModel,
  setMetadata,
  startSession,
  TimeoutModel,
} from "./lib/models/ParkingMetaData";
import { drawCodecErrors } from "./lib/util";

export const getParkingSessionMetadataFromRequest = pipe(
  RTE.ask<FunctionContext>(),
  RTE.map(({ req }) => req.body),
  RTE.chainEitherK(ParkingMetaDataModel.decode),
  RTE.mapLeft(drawCodecErrors)
);
export const getListFilterFromRequest = pipe(
  RTE.ask<FunctionContext>(),
  RTE.map(({ req }) => req.body),
  RTE.chainEitherK(FilterModel.decode),
  RTE.mapLeft(drawCodecErrors)
);

export const getCurrentTime = RTE.fromIO(() => new Date());

export const getIdFromRequest = pipe(
  RTE.ask<FunctionContext>(),
  RTE.map(({ req }) => req.body),
  RTE.chainEitherK(DocumentId.decode),
  RTE.mapLeft(drawCodecErrors)
);

export const createSession = pipe(
  sequenceT(RTE.ApplyPar)(getParkingSessionMetadataFromRequest, getCurrentTime),
  RTE.map(([metadata, now]) => pipe(startSession(now), setMetadata(metadata))),
  RTE.chainW(createParkingSessionInFireStore),
  RTE.chainW(getSessionFromFirestore),
  RTE.foldW(handleCloudFunctionError, handleCloudFunctionSuccess)
);

export const completeSession = pipe(
  sequenceT(RTE.ApplyPar)(getIdFromRequest, getCurrentTime),
  RTE.chainW(([{ id }, now]) =>
    pipe(
      now,
      endSession,
      TimeoutModel.encode,
      updateSessionInFirestore(id),
      RTE.chainW(() => getSessionFromFirestore(id))
    )
  ),
  RTE.foldW(handleCloudFunctionError, handleCloudFunctionSuccess)
);

export const listSessions = pipe(
  getListFilterFromRequest,
  RTE.chainW(listSessionsFromFirestore),
  RTE.foldW(handleCloudFunctionError, handleCloudFunctionSuccess)
);
