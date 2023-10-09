import React from "react";
import { Button, Col, Container, Row } from "react-bootstrap";

export const LoginPage: React.FC<{ onLogin: () => void }> = (
  props
) => {
  return (
    <Container
      className="d-flex justify-content-center align-items-center rounded"
      style={{ height: "100vh", backgroundColor: "" }}
    >
      <Row className={"w-50"}>
        <Col xs={12} md={12}>
          <div className="rounded p-4 text-center  bg-secondary-subtle border">
            <img
              src="/parking.svg"
              alt="Logo"
              style={{ maxWidth: "100%", width: "10em" }}
            />
            <h2>VZ Park</h2>
            <Button
              variant="success"
              size="lg"
              className="mt-3"
              onClick={props.onLogin}
            >
              Sign In with Google
            </Button>          </div>
        </Col>
      </Row>
    </Container>
  );
};
