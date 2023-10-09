import { faChevronUp, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as L from "monocle-ts/Lens";
import React from "react";
import { Button, Row } from "react-bootstrap";
import { SessionsControllerContext }  from "../../../controllers/SessionsController";
import {
  ActiveOnlyL,
  AddModeL,
  UIStateControllerContext,
} from "../../../controllers/UIStateController";
import { formatTime } from "../index";

export const SessionsHeader: React.FC<{}> = (props) => {
  const [
    {
      sessions: { addMode, activeOnly },
    },
    dispatch,
  ] = React.useContext(UIStateControllerContext);

  const { lastUpdated } = React.useContext(SessionsControllerContext);

  const handleToggleAddMode = React.useCallback(() => {
    dispatch(
      pipe(
        AddModeL,
        L.modify((currentMode) => !currentMode)
      )
    );
  }, [dispatch]);

  const handleToggleActiveOnly = React.useCallback(() => {
    dispatch(
      pipe(
        ActiveOnlyL,
        L.modify((currentMode) => !currentMode)
      )
    );
  }, [dispatch]);
  return (
    <Row className={"mt-2 mb-2"}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center">
          <h2 className="mb-0">Sessions</h2>
          <div className="form-check form-switch ms-3">
            <input
              type="checkbox"
              className="form-check-input"
              id="activeOnlyCheckbox"
              checked={activeOnly}
              onChange={handleToggleActiveOnly}
            />
            <label className="form-check-label" htmlFor="activeOnlyCheckbox">
              Active Only
            </label>
          </div>
        </div>
        <span className="badge bg-success-subtle ">
          Last Updated:{" "}
          {pipe(
            lastUpdated,
            O.map(formatTime),
            O.getOrElse(() => "Never")
          )}
        </span>
        <Button
          variant="outline-secondary"
          // className={"bg-secondary-subtle"}
          onClick={handleToggleAddMode}
        >
          {addMode ? (
            <FontAwesomeIcon icon={faChevronUp} />
          ) : (
            <FontAwesomeIcon icon={faPlus} />
          )}
        </Button>
      </div>
    </Row>
  );
};
