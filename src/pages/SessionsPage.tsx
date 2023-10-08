import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isToday } from "date-fns";
import {
  differenceInSeconds,
  formatDistance,
  formatDuration,
  parseISO,
  format,
} from "date-fns/fp";
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
import { isActive } from "../lib/models/ParkingMetaData";
import {
  completeParkingSessionRTE,
  ParkingSession,
  SessionsControllerContext,
} from "../controllers/SessionsController";
import * as AD from "../lib/tubular/AsyncData";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as RT from "fp-ts/ReaderTaskEither";
import * as IO from "fp-ts/IO";

export const FinalizeSession: React.FC<{ session: ParkingSession }> = (
  props
) => {
  const { apiURL } = React.useContext(ApplicationContext);
  const [showToast, setShowToast] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFinalizeSession = React.useCallback(() => {
    pipe(
      completeParkingSessionRTE(props.session.id),
      RTE.apFirst(RTE.fromIO(IO.of(setIsLoading(true)))),
      RTE.foldW(flow(error, RT.fromIO), () =>
        RTE.fromIO(IO.of(setShowToast(true)))
      ),
      RT.chainIOK(() => IO.of(setIsLoading(false)))
    )({ apiURL })();
  }, [apiURL, props.session]);

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
          <>
            <FontAwesomeIcon icon={faCheckCircle} />
            &nbsp; Finalize
          </>
        )}
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

export const formatTime = (time: Date) => isToday(time) ? pipe(time,format("hh:mma")) :pipe(time,format("hh:mma MMM do"))

export const SessionsTable: React.FC<{}> = (props) => {
  const { sessions } = React.useContext(SessionsControllerContext);

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
        sessions,
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
                  <td className={
                    isActive(session) ? "bg-success-subtle bg-opacity-75" : ""
                  }>{pipe(session.timeOut, O.map(formatTime), O.getOrElseW(() => <span>Active</span>))}</td>
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

const AddPlateForm = () => {
  const [formData, setFormData] = useState({
    licensePlate: "",
    carMakeModel: "",
    color: "",
  });

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    // Add your logic to handle form submission here
    console.log(formData);
  };

  return (
    <Container>
      <h1>Add New Session</h1>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="licensePlate">
          <Form.Label>License Plate</Form.Label>
          <Form.Control
            type="text"
            name="licensePlate"
            value={formData.licensePlate}
            onChange={handleInputChange}
            placeholder="Enter License Plate"
          />
        </Form.Group>
        <Form.Group controlId="carMakeModel">
          <Form.Label>Car Make/Model</Form.Label>
          <Form.Control
            type="text"
            name="carMakeModel"
            value={formData.carMakeModel}
            onChange={handleInputChange}
            placeholder="Enter Car Make/Model"
          />
        </Form.Group>
        <Form.Group controlId="color">
          <Form.Label>Color</Form.Label>
          <Form.Control
            type="text"
            name="color"
            value={formData.color}
            onChange={handleInputChange}
            placeholder="Enter Color"
          />
        </Form.Group>
        <Row>
          <Col>
            <Button variant="primary" type="submit">
              Add
            </Button>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default AddPlateForm;

export const SessionsPage: React.FC<{}> = (props) => {
  const [addMode, setAddMode] = useState<boolean>(false);

  return (
    <Container className="mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Sessions</h2>
        <Button variant="primary" onClick={() => setAddMode(!addMode)}>
          Add New Session
        </Button>
      </div>
      <Container>
        <Row>
          {addMode && (
            <Row>
              <Col className={"bg-secondary-subtle"}>
                <AddPlateForm />
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
