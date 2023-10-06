import { AuthProvider } from "@firebase/auth";
import { initializeApp } from "firebase/app";
import { log } from "fp-ts/Console";
import { pipe } from "fp-ts/function";
import React from "react";
import "./App.css";
import { Auth, getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import { Container, Nav, Navbar, NavDropdown } from "react-bootstrap";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDctVDiDJy7_zdj5D03q_ZHMAjkQ1NXm88",
  authDomain: "vend-park-challenge.firebaseapp.com",
  projectId: "vend-park-challenge",
  storageBucket: "vend-park-challenge.appspot.com",
  messagingSenderId: "575450274760",
  appId: "1:575450274760:web:8b7d7cb9bea7d2fda27efd",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export const SignInWithPopupTE = (auth: Auth, provider: AuthProvider) => TE.tryCatch(() => signInWithPopup(auth, provider), E.toError);

function App() {
  const handleSignIn =
    pipe(SignInWithPopupTE(auth, provider), TE.chainIOK(log));

  return (
    <div className="App">
      <Navbar expand="lg" className="bg-body-tertiary">
        <Container>
          <Navbar.Brand href="#home">Park!</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="#home">Sessions</Nav.Link>
            </Nav>
          </Navbar.Collapse>
          <Navbar.Collapse className="justify-content-end">
            <Navbar.Text>
              Signed in as: <a href="#login">Mark Otto</a>
            </Navbar.Text>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <button onClick={handleSignIn}>Sing In With Google</button>
    </div>
  );
}

export default App;



