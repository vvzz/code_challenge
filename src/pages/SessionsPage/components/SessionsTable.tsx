import { formatDistance } from "date-fns/fp";
import * as A from "fp-ts/Array";
import { flow, pipe } from "fp-ts/function";
import * as NEA from "fp-ts/NonEmptyArray";
import * as O from "fp-ts/Option";
import * as Ord from "fp-ts/Ord";
import React from "react";
import { Table } from "react-bootstrap";
import { FinalizeSession } from "./FinalizeSession";
import { EagerUpdatesControllerContext } from "../../../controllers/EagerUpdatesController";
import { SessionsControllerContext } from "../../../controllers/SessionsController";
import { isActive } from "../../../lib/models/ParkingMetaData";
import * as AD from "../../../lib/tubular/AsyncData";
import {
  formatTime,
  OrdByTimeInDate,
} from "../";

export const SessionsTable: React.FC<{}> = (props) => {
  const { sessions } = React.useContext(SessionsControllerContext);
  const [ { updatedSessions, newSessions } ] = React.useContext(
    EagerUpdatesControllerContext,
  );
  const parkingSessions = pipe(
    sessions,
    AD.map(
      flow(
        A.concat(newSessions),
        A.map((session) => updatedSessions.get(session.id) || session),
        A.sort(Ord.reverse(OrdByTimeInDate)),
      ),
    ),
  );

  return (
    <Table responsive>
      <thead>
      <tr>
        <th className={"bg-dark-subtle"}>Make and Model</th>
        <th className={"bg-dark-subtle"}>Color</th>
        <th className={"bg-dark-subtle"}>License Plate</th>
        <th className={"bg-dark-subtle"}>Time In</th>
        <th className={"bg-dark-subtle"}>Time Out</th>
        <th className={"bg-dark-subtle"}>Duration</th>
        <th className={"bg-dark-subtle"} />
      </tr>
      </thead>
      {pipe(
        parkingSessions,
        AD.fold(
          () => null,
          () => <TableMessage>Loading Parking Sessions</TableMessage>,
          (_) => (
            <tbody>
            {pipe(
              _,
              NEA.fromArray,
              O.map(
                NEA.map((session) => (
                  <tr key={session.id}>
                    <td>
                      {pipe(
                        session.metadata,
                        O.chain((_) => _.make),
                        O.toNullable,
                      )}{" "}
                      {pipe(
                        session.metadata,
                        O.chain((_) => _.model),
                        O.toNullable,
                      )}
                    </td>
                    <td>
                      {pipe(
                        session.metadata,
                        O.chain((_) => _.color),
                        O.toNullable,
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
                        O.toNullable,
                      )}
                    </td>
                    <td
                      className={
                        isActive(session)
                          ? "bg-success-subtle bg-opacity-75"
                          : ""
                      }
                    >
                      {pipe(session.timeIn, formatTime)}
                    </td>
                    <td
                      className={
                        isActive(session)
                          ? "bg-success-subtle bg-opacity-75"
                          : ""
                      }
                    >
                      {pipe(
                        session.timeOut,
                        O.map(formatTime),
                        O.getOrElseW(() => <span>Active</span>),
                      )}
                    </td>
                    <td>
                      {pipe(
                        session.timeIn,
                        formatDistance(
                          pipe(
                            session.timeOut,
                            O.getOrElse(() => new Date()),
                          ),
                        ),
                      )}
                    </td>
                    <td>
                      <FinalizeSession session={session} />
                    </td>
                  </tr>
                )),
              ),
              O.getOrElseW(() => (
                <TableMessage>
                  No Parking Sessions for Given Criteria
                </TableMessage>
              )),
            )}
            </tbody>
          ),
          () => <TableMessage>Error</TableMessage>,
        ),
      )}
    </Table>
  );
};
export const TableMessage: React.FC<{ children: React.ReactNode }> = (
  props,
) => (
  <tr>
    <td colSpan={7}>
      <div className={"text-center m-5"}>{props.children}</div>
    </td>
  </tr>
);