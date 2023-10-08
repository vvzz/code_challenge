import {
  faCheckCircle,
  faChevronUp,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isToday } from "date-fns";
import { formatDistance, format } from "date-fns/fp";
import { error } from "fp-ts/Console";
import { flow, pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React, { useState } from "react";
import {
  Button,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  Table,
  Toast,
} from "react-bootstrap";
import { ApplicationContext } from "../App";
import { isActive, ParkingMetadata } from "../lib/models/ParkingMetaData";
import {
  completeParkingSessionRTE,
  createParkingSessionRTE,
  EagerUpdatesControllerContext,
  NewSessionsL,
  ParkingSessionWithId,
  SessionsControllerContext,
  UpdatesSessionsL,
} from "../controllers/SessionsController";
import * as AD from "../lib/tubular/AsyncData";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as RT from "fp-ts/ReaderTaskEither";
import * as IO from "fp-ts/IO";
import * as A from "fp-ts/Array";
import * as L from "monocle-ts/Lens";
import * as Ord from "fp-ts/Ord";
import * as d from "fp-ts/Date";

export const FinalizeSession: React.FC<{ session: ParkingSessionWithId }> = (
  props
) => {
  const { apiURL } = React.useContext(ApplicationContext);
  const [eagerUpdates, dispatch] = React.useContext(
    EagerUpdatesControllerContext
  );

  const [showToast, setShowToast] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
                    new Map(eagerMap.set(updatedSession.id, updatedSession))
                )
              )
            )
          ),
          RTE.fromIO,
          RTE.chainIOK(() => IO.of(setShowToast(true)))
        )
      ),
      RT.chainIOK(() => IO.of(setIsLoading(false)))
    )({ apiURL })();
  }, [apiURL, props.session, dispatch]);

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
      <Toast
        show={showToast}
        onClose={() => setShowToast(false)}
        delay={5000} // Adjust the duration you want the toast to appear
        autohide
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          minWidth: "200px", // Adjust the width as needed
        }}
      >
        <Toast.Header>
          <strong className="me-auto">Success</strong>
        </Toast.Header>
        <Toast.Body>
          Parking session{" "}
          {pipe(
            props.session.metadata,
            O.map((_) => `for ${_.licensePlate.number}`),
            O.toUndefined
          )}{" "}
          finalized
        </Toast.Body>
      </Toast>
    </div>
  ) : null;
};

export const formatTime = (time: Date) =>
  isToday(time)
    ? pipe(time, format("hh:mma"))
    : pipe(time, format("hh:mma MMM do"));

export const OrdByTimeInDate = pipe(
  d.Ord,
  Ord.contramap((ps: ParkingSessionWithId) => ps.timeIn)
);

export const SessionsTable: React.FC<{}> = (props) => {
  const { sessions } = React.useContext(SessionsControllerContext);
  const [{ updatedSessions, newSessions }] = React.useContext(
    EagerUpdatesControllerContext
  );
  const sessionsTable = pipe(
    sessions,
    AD.map(
      flow(
        A.concat(newSessions),
        A.map((session) => updatedSessions.get(session.id) || session),
        A.sort(Ord.reverse(OrdByTimeInDate))
      )
    )
  );

  return (
    <Table responsive>
      <thead>
        <tr>
          <th>Make and Model</th>
          <th>Color</th>
          <th>License Plate</th>
          <th>Time In</th>
          <th>Time Out</th>
          <th>Duration</th>
          <th />
        </tr>
      </thead>
      {pipe(
        sessionsTable,
        AD.fold(
          () => null,
          () => <div>Loading</div>,
          (_) => (
            <tbody>
              {_.map((session, i) => (
                <tr key={i}>
                  <td>
                    {pipe(
                      session.metadata,
                      O.chain((_) => _.make),
                      O.toNullable
                    )}{" "}
                    {pipe(
                      session.metadata,
                      O.chain((_) => _.model),
                      O.toNullable
                    )}
                  </td>
                  <td>
                    {pipe(
                      session.metadata,
                      O.chain((_) => _.color),
                      O.toNullable
                    )}
                  </td>
                  <td>
                    {pipe(
                      session.metadata,
                      O.map((_) => (
                        <span>
                          {_.licensePlate.number}{" "}
                          <strong>{_.licensePlate.state}</strong>
                        </span>
                      )),
                      O.toNullable
                    )}
                  </td>
                  <td
                    className={
                      isActive(session) ? "bg-success-subtle bg-opacity-75" : ""
                    }
                  >
                    {pipe(session.timeIn, formatTime)}
                  </td>
                  <td
                    className={
                      isActive(session) ? "bg-success-subtle bg-opacity-75" : ""
                    }
                  >
                    {pipe(
                      session.timeOut,
                      O.map(formatTime),
                      O.getOrElseW(() => <span>Active</span>)
                    )}
                  </td>
                  <td>
                    {pipe(
                      session.timeIn,
                      formatDistance(
                        pipe(
                          session.timeOut,
                          O.getOrElse(() => new Date())
                        )
                      )
                    )}
                  </td>
                  <td>
                    <FinalizeSession session={session} />
                  </td>
                </tr>
              ))}
            </tbody>
          ),
          () => <div>Error</div>
        )
      )}
    </Table>
  );
};

const AddParkingSesionForm: React.FC<{ onSuccess: () => void }> = () => {
  // Define state variables to capture form input values
  const [licensePlate, setLicensePlate] = useState("");
  const [state, setState] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const { apiURL } = React.useContext(ApplicationContext);
  const [eagerUpdates, dispatch] = React.useContext(
    EagerUpdatesControllerContext
  );

  const [showToast, setShowToast] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Handler function to add parking session
  const handleAddParkingSession = () => {
    const newParkingSessionMetadata: ParkingMetadata = {
      color: O.fromNullable(color),
      make: O.fromNullable(make),
      model: O.fromNullable(model),
      licensePlate: {
        state,
        number: licensePlate,
      },
    };
    pipe(
      createParkingSessionRTE(newParkingSessionMetadata),
      RTE.apFirst(RTE.fromIO(IO.of(setIsLoading(true)))),
      RTE.foldW(flow(error, RT.fromIO), (updatedSession) =>
        pipe(
          () => {
            console.log("added", updatedSession);
            dispatch(pipe(NewSessionsL, L.modify(A.prepend(updatedSession))));
          },
          RTE.fromIO,
          RTE.chainIOK(() => IO.of(setShowToast(true)))
        )
      ),
      RT.chainIOK(() => IO.of(setIsLoading(false))),
      RTE.chainIOK(() => () => {
        setLicensePlate("");
        setState("");
        setMake("");
        setModel("");
        setColor("");
      })
    )({ apiURL })();
  };

  return (
    <Container>
      <Form
        className="m-2"
        onSubmit={(ev) => {
          ev.preventDefault();
          handleAddParkingSession();
        }}
      >
        <Row className="mb-3">
          <Form.Group as={Col} controlId="formGridLicensePlate">
            <Form.Control
              type="text"
              placeholder="License Plate"
              autoFocus={true}
              required={true}
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
            />
          </Form.Group>

          <Form.Group as={Col} controlId="formGridState">
            <Form.Control
              type="text"
              placeholder="State"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </Form.Group>
        </Row>

        <Row className="mb-3">
          <Form.Group as={Col} controlId="formGridMake">
            <Form.Control
              type="text"
              placeholder="Make"
              value={make}
              onChange={(e) => setMake(e.target.value)}
            />
          </Form.Group>
          <Form.Group as={Col} controlId="formGridModel">
            <Form.Control
              type="text"
              placeholder="Model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </Form.Group>
          <Form.Group as={Col} controlId="formGridColor">
            <Form.Control
              type="text"
              placeholder="Color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </Form.Group>
        </Row>
        <Button variant="primary" type="submit">
          Add Parking Session
        </Button>
      </Form>
    </Container>
  );
};

export default AddParkingSesionForm;

export const SessionsPage: React.FC<{}> = (props) => {
  const [addMode, setAddMode] = useState<boolean>(false);
  const { lastUpdated } = React.useContext(SessionsControllerContext);

  return (
    <Container className="mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center">
          <h2 className="mb-0">Sessions</h2>
          <div className="form-check form-switch ms-3">
            <input
              type="checkbox"
              className="form-check-input"
              id="activeOnlyCheckbox"
              checked={false}
              onChange={() => {}}
            />
            <label className="form-check-label" htmlFor="activeOnlyCheckbox">
              Active Only
            </label>
          </div>
        </div>
        <span className="badge bg-primary ">
          Last Updated:{" "}
          {pipe(
            lastUpdated,
            O.map(formatTime),
            O.getOrElse(() => "Never")
          )}
        </span>
        <Button variant="secondary" onClick={() => setAddMode(!addMode)}>
          {addMode ? (
            <FontAwesomeIcon icon={faChevronUp} />
          ) : (
            <FontAwesomeIcon icon={faPlus} />
          )}
        </Button>
      </div>
      <Container>
        <Row>
          {addMode && (
            <Row>
              <Col className={"bg-secondary-subtle"}>
                <AddParkingSesionForm onSuccess={() => setAddMode(false)} />
              </Col>
            </Row>
          )}
          <Col>
            <SessionsTable />
          </Col>
        </Row>
      </Container>
    </Container>
  );
};
