import { pipe } from "fp-ts/function";
import * as L from "monocle-ts/Lens";
import React, { useEffect } from "react";
import {
  ParkingSessionWithId,
  SessionsControllerContext,
} from "./SessionsController";

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



