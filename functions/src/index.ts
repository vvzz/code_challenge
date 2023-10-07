import { onRequest } from "firebase-functions/v2/https";
import { Response } from "express";
import * as express from "express";
import * as cors from "cors";
import * as admin from "firebase-admin";
import { flow, pipe } from "fp-ts/function";
import * as C from "io-ts/Codec";
import * as D from "io-ts/Decoder";
import * as O from "fp-ts/Option";
import * as En from "io-ts/Encoder";
import * as E from "fp-ts/Either";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import { Firestore } from "firebase-admin/firestore";

type EntryType = {
  title: string;
  text: string;
  coverImageUrl: string;
};

type Request = {
  body: EntryType;
  params: { entryId: string };
};

export const optionFromNullable = <A, O>(
  c: C.Codec<unknown, O, A>
): C.Codec<unknown, O | null, O.Option<A>> =>
  C.make(
    pipe(
      D.id<unknown>(),
      D.parse((_) =>
        pipe(
          _,
          O.fromNullable,
          O.foldW(() => D.success(O.none), flow(c.decode, E.map(O.some)))
        )
      )
    ),
    pipe(En.id<O | null>(), En.contramap(flow(O.map(c.encode), O.toNullable)))
  );

export const ParkingSessionModel = C.struct({
  timeIn: C.string,
  licensePlate: C.struct({
    state: C.string,
    number: C.string,
  }),
  timeOut: optionFromNullable(C.string),
  color: optionFromNullable(C.string),
  make: optionFromNullable(C.string),
  model: optionFromNullable(C.string),
});

export type ParkingSession = C.TypeOf<typeof ParkingSessionModel>;

export const completeSession = (now: Date) => (session: ParkingSession) => ({
  ...session,
  timeOut: pipe(now.toISOString(), O.some),
});

admin.initializeApp();

export const startSession = async (req: Request, res: Response) => {
  const session = pipe(req.body, ParkingSessionModel.decode);
  return session;
};

export type FirestoreContext = {
  firestore: Firestore;
};

export const PARKING_SESSIONS_COLLECTION = "parking-sessions";

export const createSessionRTE = (parkingSession: ParkingSession) =>
  pipe(
    RTE.ask<FirestoreContext>(),
    RTE.chainTaskEitherK(({ firestore }) =>
      TE.tryCatch(() => {
        const parkingSessionDocument = firestore
          .collection(PARKING_SESSIONS_COLLECTION)
          .doc();
        const parkingSessionObject = {
          id: parkingSessionDocument.id,
          ...parkingSession,
        };
        return parkingSessionDocument.set(parkingSessionObject);
      }, E.toError)
    )
  );

export const listSessionsRTE = pipe(
  RTE.ask<FirestoreContext>(),
  RTE.chainTaskEitherK(({ firestore }) =>
    TE.tryCatch(() => {
      return firestore.collection(PARKING_SESSIONS_COLLECTION).get();
    }, E.toError)
  ),
  RTE.map((_) => _.docs)
);
export const updateSessionRTE = (session: ParkingSession) => (id: string) =>
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

const addEntry = async (req: Request, res: Response) => {
  const db = admin.firestore();

  const { title, text } = req.body;
  try {
    const entry = db.collection("entries").doc();
    const entryObject = {
      id: entry.id,
      title,
      text,
    };

    entry.set(entryObject);

    res.status(200).send({
      status: "success",
      message: "entry added successfully",
      data: entryObject,
    });
  } catch (error) {
    res.status(500).json("We found an error posting your request!");
  }
};

const server = express();
server.use(cors({ origin: true }));

server.post("/listSessions", (req, res) => res.status(200).send("Hey there!"));
server.post("/createSession", addEntry);
server.post("/completeSession", addEntry);

export const api = onRequest(server);

export const health = onRequest((request, response) => {
  response.status(200).send("ok");
});
