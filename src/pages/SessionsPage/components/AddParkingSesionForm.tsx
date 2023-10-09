import * as A from "fp-ts/Array";
import { error } from "fp-ts/Console";
import { flow, pipe } from "fp-ts/function";
import * as IO from "fp-ts/IO";
import * as O from "fp-ts/Option";
import * as RT from "fp-ts/ReaderTaskEither";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as L from "monocle-ts/Lens";
import React, { useState } from "react";
import { Button, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import { ApplicationContext } from "../../../App";
import {
  EagerUpdatesControllerContext,
  NewSessionsL,
} from "../../../controllers/EagerUpdatesController";
import { createParkingSessionRTE } from "../../../controllers/SessionsController";
import { ParkingMetadata } from "../../../lib/models/ParkingMetaData";

export const AddParkingSesionForm: React.FC<{}> = () => {
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
        pipe(() => {
          console.log("added", updatedSession);
          dispatch(pipe(NewSessionsL, L.modify(A.prepend(updatedSession))));
        }, RTE.fromIO)
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
    <Container className="pb-4 pt-4 ">
      <Form
        className={"justify-content-end"}
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
        <div className="text-end">
          <Button variant="primary" type="submit">
            {isLoading ? (
              <>
                {" "}
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
                Adding
              </>
            ) : (
              "Add Parking Session"
            )}
          </Button>
        </div>
      </Form>
    </Container>
  );
};
