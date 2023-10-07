import { warn } from "fp-ts/Console";
import * as E from "fp-ts/Either";
import { flow, pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as RT from "fp-ts/ReaderTask";
import * as TE from "fp-ts/TaskEither";
import * as IO from "fp-ts/IO";
import { APISuccessModel, getData } from "../lib/models/APISuccess";
import { drawCodecErrors } from "../lib/util";
import {
  ParkingSession,
  ParkingSessionModel,
} from "../lib/models/ParkingMetaData";
import React, { useEffect, useState } from "react";
import { ApplicationContext } from "../App";
import { ApiContext } from "../contexts/ApiContext";
import * as AD from "../lib/tubular/AsyncData";
import * as C from "io-ts/Codec";

export const fetchParkingSessionsRTE = pipe(
  RTE.ask<ApiContext>(),
  RTE.chainTaskEitherK(({ apiURL }) =>
    TE.tryCatch(
      () => fetch(`${apiURL}/listSessions`, { method: "POST" }).then(res => res.json()),
      E.toError
    )
  ),
  RTE.chainEitherKW(
    flow(
      APISuccessModel(C.array(ParkingSessionModel)).decode,
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

  console.log("Sess", sessions);
  return (
    <SessionsControllerContext.Provider value={{ sessions }}>
      {props.children}
    </SessionsControllerContext.Provider>
  );
};
