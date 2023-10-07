import * as cors from "cors";
import * as express from "express";
import { Request, Response } from "express";
import * as admin from "firebase-admin";
import { DocumentData, Firestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { sequenceT } from "fp-ts/Apply";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import * as C from "io-ts/Codec";
import * as D from "io-ts/Decoder";
import { DecodeError } from "io-ts/Decoder";
import {
  FunctionContext,
  handleCloudFunctionError,
  handleCloudFunctionSuccess,
} from "./lib/cloudFunction";
import { DocumentId } from "./lib/models/DocumentId";
import { optionFromNullable } from "./lib/models/optionFromNullable";
import {
  endSession,
  ParkingMetaDataModel,
  ParkingSession,
  ParkingSessionModel,
  setMetadata,
  startSession,
  TimeoutModel,
} from "./lib/models/ParkingMetaData";

admin.initializeApp();
const db = admin.firestore();

export const drawCodecErrors = (e: DecodeError) => new Error(D.draw(e));

export const FilterModel = pipe(
  C.struct({
    pageSize: optionFromNullable(C.number),
    start: optionFromNullable(C.number),
  })
);

export type Filter = C.TypeOf<typeof FilterModel>;

export type FirestoreContext = {
  firestore: Firestore;
};

export const PARKING_SESSIONS_COLLECTION = "parking-sessions";

export const createParkingSessionInFireStoreRTE = (
  parkingSession: ParkingSession
) =>
  pipe(
    RTE.ask<FirestoreContext>(),
    RTE.chainTaskEitherK(({ firestore }) =>
      TE.tryCatch(() => {
        const parkingSessionDocument = firestore
          .collection(PARKING_SESSIONS_COLLECTION)
          .doc();
        const parkingSessionObject = {
          id: parkingSessionDocument.id,
          ...ParkingSessionModel.encode(parkingSession),
        };
        return parkingSessionDocument.set(parkingSessionObject);
      }, E.toError)
    )
  );

export const listSessionsFromFirestoreRTE = (filter: Filter) =>
  pipe(
    RTE.ask<FirestoreContext>(),
    RTE.chainTaskEitherK(({ firestore }) =>
      TE.tryCatch(() => {
        const collectionRef = firestore.collection(PARKING_SESSIONS_COLLECTION);
        pipe(
          filter.pageSize,
          O.fold(
            () => {},
            (pageSize) => collectionRef.limit(pageSize)
          )
        );
        pipe(
          filter.start,
          O.fold(
            () => {},
            (start) => collectionRef.startAt(start)
          )
        );

        return collectionRef.get();
      }, E.toError)
    ),
    RTE.map((_) => {
      const documents: Array<DocumentData> = [];
      _.forEach((_) => documents.push(_.data()));
      return documents;
    })
  );
export const updateSessionRTE =
  (id: string) => (session: Partial<C.OutputOf<typeof ParkingSessionModel>>) =>
    pipe(
      RTE.ask<FirestoreContext>(),
      RTE.chainTaskEitherK(({ firestore }) =>
        TE.tryCatch(() => {
          return firestore
            .collection(PARKING_SESSIONS_COLLECTION)
            .doc(id)
            .update(session);
        }, E.toError)
      )
    );

const server = express();
server.use(cors({ origin: true }));

export const getParkingSessionMetadataFromRequest = pipe(
  RTE.ask<FunctionContext>(),
  RTE.map(({ req }) => req.body),
  RTE.chainEitherK(ParkingMetaDataModel.decode),
  RTE.mapLeft(drawCodecErrors)
);

export const getCurrentTime = RTE.fromIO(() => new Date());

export const createSession = async (req: Request, res: Response) =>
  pipe(
    sequenceT(RTE.ApplyPar)(
      getParkingSessionMetadataFromRequest,
      getCurrentTime
    ),
    RTE.map(([metadata, now]) =>
      pipe(startSession(now), setMetadata(metadata))
    ),
    RTE.chainW(createParkingSessionInFireStoreRTE),
    RTE.foldW(handleCloudFunctionError, handleCloudFunctionSuccess)
  )({ req, res, firestore: db })();

export const getListFilterFromRequest = pipe(
  RTE.ask<FunctionContext>(),
  RTE.map(({ req }) => req.body),
  RTE.chainEitherK(FilterModel.decode),
  RTE.mapLeft(drawCodecErrors)
);
export const listSessions = async (req: Request, res: Response) =>
  pipe(
    getListFilterFromRequest,
    RTE.chainW(listSessionsFromFirestoreRTE),
    RTE.foldW(handleCloudFunctionError, handleCloudFunctionSuccess)
  )({ req, res, firestore: db })();

export const getIdFromRequest = pipe(
  RTE.ask<FunctionContext>(),
  RTE.map(({ req }) => req.body),
  RTE.chainEitherK(DocumentId.decode),
  RTE.mapLeft(drawCodecErrors)
);

export const completeSession = async (req: Request, res: Response) =>
  pipe(
    sequenceT(RTE.ApplyPar)(getIdFromRequest, getCurrentTime),
    RTE.chainW(([{ id }, now]) =>
      pipe(now, endSession, TimeoutModel.encode, updateSessionRTE(id))
    ),
    RTE.foldW(handleCloudFunctionError, handleCloudFunctionSuccess)
  )({ req, res, firestore: db })();

server.post("/listSessions", listSessions);
server.post("/createSession", createSession);
server.post("/completeSession", completeSession);

export const api = onRequest(server);

export const health = onRequest((request, response) => {
  response.status(200).send("ok");
});
