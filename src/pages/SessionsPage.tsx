import React from "react";
import { Button, Container, Table } from "react-bootstrap";

export const SessionsPage: React.FC<{}> = (props) => {
  const sessions = [
    {
      id: 1,
      makeAndModel: "Toyota Camry",
      color: "Silver",
      licensePlate: "AB123CD",
      timeIn: "2023-10-15 09:30 AM",
      timeOut: "2023-10-15 12:45 PM",
    },
    {
      id: 2,
      makeAndModel: "Honda Civic",
      color: "Blue",
      licensePlate: "XY456ZW",
      timeIn: "2023-10-15 11:15 AM",
      timeOut: "2023-10-15 03:20 PM",
    },
    // Add more session data as needed
  ];

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
        <tbody>
          {sessions.map((session) => (
            <tr key={session.id}>
              <td>{session.makeAndModel}</td>
              <td>{session.color}</td>
              <td>{session.licensePlate}</td>
              <td>{session.timeIn}</td>
              <td>{session.timeOut}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};
