import { warn } from "fp-ts/Console";
import * as E from "fp-ts/Either";
import { flow, pipe } from "fp-ts/function";
import * as IO from "fp-ts/IO";
import * as O from "fp-ts/Option";
import * as RT from "fp-ts/ReaderTask";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import * as C from "io-ts/Codec";
import * as L from "monocle-ts/Lens";
import React, { useEffect, useState } from "react";
import { UIStateControllerContext } from "../controllers/UIStateController";
import { ApplicationContext, AuthContext } from "../App";
import { ApiContext } from "../contexts/ApiContext";
import { APISuccessModel, getData } from "../lib/models/APISuccess";
import { DocumentId } from "../lib/models/DocumentId";
import {
  ParkingMetadata,
  ParkingMetaDataModel,
  ParkingSessionModel,
} from "../lib/models/ParkingMetaData";
import * as AD from "../lib/tubular/AsyncData";
import { drawCodecErrors } from "../lib/util";

export const ParkingSessionDocumentModel =
  C.intersect(ParkingSessionModel)(DocumentId);

export type ParkingSessionWithId = C.TypeOf<typeof ParkingSessionDocumentModel>;

export type FilteringContext = {
  activeOnly: boolean;
};

export const getIdToken = pipe(
  RTE.ask<AuthContext>(),
  RTE.chainTaskEitherK(({ user }) =>
    TE.tryCatch(() => user.getIdToken(), E.toError)
  )
);

export const fetchParkingSessionsRTE = pipe(
  getIdToken,
  RTE.chainW((token) =>
    pipe(
      RTE.ask<ApiContext & FilteringContext & AuthContext>(),
      RTE.chainTaskEitherK(({ apiURL, activeOnly }) =>
        TE.tryCatch(
          () =>
            fetch(`${apiURL}/listSessions`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ active: activeOnly }),
            }).then((res) => res.json()),
          E.toError
        )
      )
    )
  ),
  RTE.chainEitherKW(
    flow(
      APISuccessModel(C.array(ParkingSessionDocumentModel)).decode,
      E.mapLeft(drawCodecErrors),
      E.map(getData)
    )
  )
);

export const completeParkingSessionRTE = (id: string) =>
  pipe(
    getIdToken,
    RTE.chainW((token) =>
      pipe(
        RTE.ask<ApiContext>(),
        RTE.chainTaskEitherK(({ apiURL }) =>
          TE.tryCatch(
            () =>
              fetch(`${apiURL}/completeSession`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ id }),
              }).then((res) => res.json()),
            E.toError
          )
        ),
        RTE.chainEitherKW(
          flow(
            APISuccessModel(ParkingSessionDocumentModel).decode,
            E.mapLeft(drawCodecErrors),
            E.map(getData)
          )
        )
      )
    )
  );
export const createParkingSessionRTE = (metadata: ParkingMetadata) =>
  pipe(
    getIdToken,
    RTE.chainW((token) =>
      pipe(
        RTE.ask<ApiContext>(),
        RTE.chainTaskEitherK(({ apiURL }) =>
          TE.tryCatch(
            () =>
              fetch(`${apiURL}/createSession`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(ParkingMetaDataModel.encode(metadata)),
              }).then((res) => res.json()),
            E.toError
          )
        ),
        RTE.chainEitherKW(
          flow(
            APISuccessModel(ParkingSessionDocumentModel).decode,
            E.mapLeft(drawCodecErrors),
            E.map(getData)
          )
        )
      )
    )
  );

export type SessionsControllerState = {
  sessions: AD.AsyncData<Array<ParkingSessionWithId>>;
  lastUpdated: O.Option<Date>;
};

export const SesionsL = pipe(
  L.id<SessionsControllerState>(),
  L.prop("sessions")
);
export const LastUpdatedL = pipe(
  L.id<SessionsControllerState>(),
  L.prop("lastUpdated")
);

export const SessionsControllerContext =
  React.createContext<SessionsControllerState>(null as never);

export const fetchSessions = (
  dispatch: React.Dispatch<React.SetStateAction<SessionsControllerState>>
) =>
  pipe(
    fetchParkingSessionsRTE,
    RTE.foldW(
      flow(warn, RT.fromIO),
      flow(
        AD.done,
        SesionsL.set,
        dispatch,
        IO.of,
        RT.fromIO,
        RT.chainIOK(() =>
          IO.of(pipe(new Date(), O.some, LastUpdatedL.set, dispatch))
        )
      )
    )
  );

export const SessionsController: React.FC<{ children?: React.ReactNode }> = (
  props
) => {
  const [sessions, dispatch] = useState<SessionsControllerState>({
    sessions: AD.none,
    lastUpdated: O.none,
  });
  const { apiURL, user } = React.useContext(ApplicationContext);
  const [
    {
      sessions: { activeOnly },
    },
  ] = React.useContext(UIStateControllerContext);

  useEffect(() => {
    fetchSessions(dispatch)({ apiURL, activeOnly, user })();
    const interval = setInterval(
      fetchSessions(dispatch)({ apiURL, activeOnly, user }),
      10000
    );
    return () => clearInterval(interval);
  }, [apiURL, activeOnly, user]);

  return (
    <SessionsControllerContext.Provider value={sessions}>
      {props.children}
    </SessionsControllerContext.Provider>
  );
};
