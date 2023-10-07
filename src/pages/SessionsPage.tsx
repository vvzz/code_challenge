import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { Button, Container, Table } from "react-bootstrap";
import { SessionsControllerContext } from "../controllers/SessionsController";
import * as AD from "../lib/tubular/AsyncData";

export const SessionsPage: React.FC<{}> = (props) => {
  const { sessions } = React.useContext(SessionsControllerContext);

  return (
    <Container className="mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Sessions</h2>
        <Button variant="primary">Add New Session</Button>
      </div>

      {/* Table of Parking Sessions */}
      <Table responsive>
        <thead>
          <tr>
            <th>Make and Model</th>
            <th>Color</th>
            <th>License Plate</th>
            <th>Time In</th>
            <th>Time Out</th>
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
                    <td>ford</td>
                    <td>ford</td>
                    <td>
                      {pipe(
                        session.metadata,
                        O.map((_) => <span>{_.licensePlate.number} <strong>{_.licensePlate.state}</strong></span>),
                        O.toNullable
                      )}
                    </td>
                    <td>{session.timeIn}</td>
                    <td>{pipe(session.timeOut, O.toNullable)}</td>
                  </tr>
                ))}
              </tbody>
            ),
            () => <div>Error</div>
          )
        )}
      </Table>
    </Container>
  );
};
