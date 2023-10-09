import { DocumentData, Firestore } from "firebase-admin/lib/firestore";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import * as C from "io-ts/Codec";
import { FilterParams } from "./models/FilterParams";
import { ParkingSession, ParkingSessionModel } from "./models/ParkingMetaData";

export type FirestoreContext = {
  firestore: Firestore;
};
export const PARKING_SESSIONS_COLLECTION = "parking-sessions";

export const createParkingSessionInFireStore = (
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
        return parkingSessionDocument
          .set(parkingSessionObject)
          .then(() => parkingSessionDocument.id);
      }, E.toError)
    )
  );

export const readSnapshotDocument = (data: DocumentData) => {
  const timeIn = data.timeIn && data.timeIn.toDate().toISOString();
  const timeOut = data.timeOut && data.timeOut.toDate().toISOString();
  return { ...data, timeIn, timeOut };
};

export const listSessionsFromFirestore = (filter: FilterParams) =>
  pipe(
    RTE.ask<FirestoreContext>(),
    RTE.chainTaskEitherK(({ firestore }) =>
      TE.tryCatch(() => {
        const collectionRef = filter.active
          ? firestore
              .collection(PARKING_SESSIONS_COLLECTION)
              .where("timeOut", "==", null)
          : firestore.collection(PARKING_SESSIONS_COLLECTION);

        return collectionRef
          .orderBy("timeIn", "desc")
          .get()
          .then((qs) => {
            const documents: Array<DocumentData> = [];
            qs.forEach((doc) =>
              documents.push(readSnapshotDocument(doc.data()))
            );
            return documents;
          });
      }, E.toError)
    )
  );

export const getSessionFromFirestore = (id: string) =>
  pipe(
    RTE.ask<FirestoreContext>(),
    RTE.chainTaskEitherK(({ firestore }) =>
      TE.tryCatch(
        () =>
          firestore
            .collection(PARKING_SESSIONS_COLLECTION)
            .doc(id)
            .get()
            .then((ds) => {
              const data = ds.data();
              return data ? readSnapshotDocument(data) : {};
            }),
        E.toError
      )
    )
  );

export const updateSessionInFirestore =
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
