import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { error } from "fp-ts/Console";
import { flow, pipe } from "fp-ts/function";
import * as IO from "fp-ts/IO";
import * as RT from "fp-ts/ReaderTaskEither";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as L from "monocle-ts/Lens";
import React, { useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { ApplicationContext } from "../../../App";
import {
  EagerUpdatesControllerContext,
  UpdatesSessionsL,
} from "../../../controllers/EagerUpdatesController";
import {
  completeParkingSessionRTE,
  ParkingSessionWithId,
} from "../../../controllers/SessionsController";
import { isActive } from "../../../lib/models/ParkingMetaData";

export const FinalizeSession: React.FC<{ session: ParkingSessionWithId }> = (
  props,
) => {
  const { apiURL } = React.useContext(ApplicationContext);
  const [ eagerUpdates, dispatch ] = React.useContext(
    EagerUpdatesControllerContext,
  );

  const [ isLoading, setIsLoading ] = useState(false);

  const handleFinalizeSession = React.useCallback(() => {
    pipe(
      completeParkingSessionRTE(props.session.id),
      RTE.apFirst(RTE.fromIO(IO.of(setIsLoading(true)))),
      RTE.foldW(flow(error, RT.fromIO), (updatedSession) =>
        pipe(
          IO.of(
            dispatch(
              pipe(
                UpdatesSessionsL,
                L.modify(
                  (eagerMap) =>
                    new Map(eagerMap.set(updatedSession.id, updatedSession)),
                ),
              ),
            ),
          ),
          RTE.fromIO,
        ),
      ),
      RT.chainIOK(() => IO.of(setIsLoading(false))),
    )({ apiURL })();
  }, [ apiURL, props.session, dispatch ]);

  return isActive(props.session) ? (
    <div>
      <Button
        variant="success"
        className={"btn-sm"}
        onClick={handleFinalizeSession}
        style={{ width: "8em" }}
      >
        {isLoading ? (
          <Spinner
            as="span"
            animation="border"
            size="sm"
            role="status"
            aria-hidden="true"
          />
        ) : (
          <FontAwesomeIcon icon={faCheckCircle} />
        )}
        &nbsp;Finalize
      </Button>
    </div>
  ) : null;
};