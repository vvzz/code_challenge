import { isToday } from "date-fns";
import { format } from "date-fns/fp";
import * as d from "fp-ts/Date";
import { pipe } from "fp-ts/function";
import * as Ord from "fp-ts/Ord";
import React from "react";
import { Container, Row } from "react-bootstrap";
import { ParkingSessionWithId } from "../../controllers/SessionsController";
import { UIStateControllerContext } from "../../controllers/UIStateController";
import { AddParkingSesionForm } from "./components/AddParkingSesionForm";
import { SessionsHeader } from "./components/SessionsHeader";
import { SessionsTable } from "./components/SessionsTable";

export const formatTime = (time: Date) =>
  isToday(time)
    ? pipe(time, format("hh:mma"))
    : pipe(time, format("hh:mma MMM do"));

export const OrdByTimeInDate = pipe(
  d.Ord,
  Ord.contramap((ps: ParkingSessionWithId) => ps.timeIn)
);

export const SessionsPage: React.FC<{}> = (props) => {
  const [
    {
      sessions: { addMode },
    },
  ] = React.useContext(UIStateControllerContext);

  return (
    <Container className={"pb-3"}>
      <SessionsHeader />
      {addMode && (
        <Row className={""}>
          <AddParkingSesionForm />
        </Row>
      )}
      <Row>
        <SessionsTable />
      </Row>
    </Container>
  );
};
