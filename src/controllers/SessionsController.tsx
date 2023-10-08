import { warn } from "fp-ts/Console";
import * as E from "fp-ts/Either";
import { flow, pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as RT from "fp-ts/ReaderTask";
import * as TE from "fp-ts/TaskEither";
import * as IO from "fp-ts/IO";
import * as O from "fp-ts/Option";
import { DocumentId } from "../lib/models/DocumentId";
import { APISuccessModel, getData } from "../lib/models/APISuccess";
import { drawCodecErrors } from "../lib/util";
import {
  ParkingMetadata,
  ParkingMetaDataModel,
  ParkingSessionModel,
} from "../lib/models/ParkingMetaData";
import React, { useEffect, useState } from "react";
import { ApplicationContext } from "../App";
import { ApiContext } from "../contexts/ApiContext";
import * as AD from "../lib/tubular/AsyncData";
import * as C from "io-ts/Codec";
import * as L from "monocle-ts/Lens";

export const ParkingSessionDocumentModel =
  C.intersect(ParkingSessionModel)(DocumentId);

export type ParkingSessionWithId = C.TypeOf<typeof ParkingSessionDocumentModel>;

export const fetchParkingSessionsRTE = pipe(
  RTE.ask<ApiContext>(),
  RTE.chainTaskEitherK(({ apiURL }) =>
    TE.tryCatch(
      () =>
        fetch(`${apiURL}/listSessions`, { method: "POST" }).then((res) =>
          res.json()
        ),
      E.toError
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
    RTE.ask<ApiContext>(),
    RTE.chainTaskEitherK(({ apiURL }) =>
      TE.tryCatch(
        () =>
          fetch(`${apiURL}/completeSession`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
  );
export const createParkingSessionRTE = (metadata: ParkingMetadata) =>
  pipe(
    RTE.ask<ApiContext>(),
    RTE.chainTaskEitherK(({ apiURL }) =>
      TE.tryCatch(
        () =>
          fetch(`${apiURL}/createSession`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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

export type EagerUpdatesControllerState = {
  updatedSessions: Map<string, ParkingSessionWithId>;
  newSessions: Array<ParkingSessionWithId>;
};
export const EagerUpdatesControllerContext = React.createContext<
  [
    EagerUpdatesControllerState,
    React.Dispatch<React.SetStateAction<EagerUpdatesControllerState>>,
  ]
>(null as never);

export const initialState: EagerUpdatesControllerState = {
  updatedSessions: new Map(),
  newSessions: [],
};

export const UpdatesSessionsL = pipe(
  L.id<EagerUpdatesControllerState>(),
  L.prop("updatedSessions")
);
export const NewSessionsL = pipe(
  L.id<EagerUpdatesControllerState>(),
  L.prop("newSessions")
);

export const EagerUpdatesController: React.FC<{
  children?: React.ReactNode;
}> = (props) => {
  const [state, dispatch] =
    React.useState<EagerUpdatesControllerState>(initialState);
  const { sessions } = React.useContext(SessionsControllerContext);
  useEffect(() => {
    dispatch(initialState);
  }, [sessions]);

  return (
    <EagerUpdatesControllerContext.Provider value={[state, dispatch]}>
      {props.children}
    </EagerUpdatesControllerContext.Provider>
  );
};

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
  const { apiURL } = React.useContext(ApplicationContext);

  useEffect(() => {
    fetchSessions(dispatch)({ apiURL })();
    const interval = setInterval(fetchSessions(dispatch)({ apiURL }), 10000);
    return () => clearInterval(interval);
  }, [apiURL]);

  return (
    <SessionsControllerContext.Provider value={sessions}>
      {props.children}
    </SessionsControllerContext.Provider>
  );
};
