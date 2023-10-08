import { warn } from "fp-ts/Console";
import * as E from "fp-ts/Either";
import { flow, pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as RT from "fp-ts/ReaderTask";
import * as TE from "fp-ts/TaskEither";
import * as IO from "fp-ts/IO";
import { DocumentId } from "../lib/models/DocumentId";
import { APISuccessModel, getData } from "../lib/models/APISuccess";
import { drawCodecErrors } from "../lib/util";
import { ParkingSessionModel } from "../lib/models/ParkingMetaData";
import React, { useEffect, useState } from "react";
import { ApplicationContext } from "../App";
import { ApiContext } from "../contexts/ApiContext";
import * as AD from "../lib/tubular/AsyncData";
import * as C from "io-ts/Codec";

export const ParkingSessionDocumentModel =
  C.intersect(ParkingSessionModel)(DocumentId);

export type ParkingSession = C.TypeOf<typeof ParkingSessionDocumentModel>;

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

export type SessionsControllerState = {
  sessions: AD.AsyncData<Array<ParkingSession>>;
};

export const SessionsControllerContext =
  React.createContext<SessionsControllerState>(null as never);

export type EagerUpdatesControllerState = Map<string, ParkingSession>;
export const EagerUpdatesControllerContext = React.createContext<
  [
    EagerUpdatesControllerState,
    React.Dispatch<React.SetStateAction<EagerUpdatesControllerState>>,
  ]
>(null as never);
export const EagerUpdatesController: React.FC<{
  children?: React.ReactNode;
}> = (props) => {
  const localState = React.useState<EagerUpdatesControllerState>(new Map());
  const { sessions } = React.useContext(SessionsControllerContext);
  useEffect(() => {
    localState[1](new Map());
  }, [sessions]);

  return (
    <EagerUpdatesControllerContext.Provider value={localState}>
      {props.children}
    </EagerUpdatesControllerContext.Provider>
  );
};

export const SessionsController: React.FC<{ children?: React.ReactNode }> = (
  props
) => {
  const [sessions, dispatch] = useState<AD.AsyncData<Array<ParkingSession>>>(
    AD.none
  );
  const { apiURL } = React.useContext(ApplicationContext);
  useEffect(() => {
    pipe(
      fetchParkingSessionsRTE,
      RTE.foldW(
        flow(warn, RT.fromIO),
        flow(AD.done, dispatch, IO.of, RT.fromIO)
      )
    )({ apiURL })();
  }, [apiURL]);

  return (
    <SessionsControllerContext.Provider value={{ sessions }}>
      {props.children}
    </SessionsControllerContext.Provider>
  );
};
