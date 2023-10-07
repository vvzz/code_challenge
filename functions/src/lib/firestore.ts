import { DocumentData, Firestore } from "firebase-admin/lib/firestore";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import * as C from "io-ts/Codec";
import { Filter } from "./models/Filter";
import { ParkingSession, ParkingSessionModel } from "./models/ParkingMetaData";

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
export const updateSessionInFirestoreRTE =
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
