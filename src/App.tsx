import { AuthProvider } from "@firebase/auth";
import { initializeApp } from "firebase/app";
import {
  Auth,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
} from "firebase/auth";
import { log } from "fp-ts/Console";
import * as E from "fp-ts/Either";
import { flow, pipe } from "fp-ts/function";
import * as IO from "fp-ts/IO";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import React, { useState } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import { LoginPage } from "./pages/LoginPage";
import { SessionsPage } from "./pages/SessionsPage";
import "./App.css";

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

export const SignInWithPopupTE = (auth: Auth, provider: AuthProvider) =>
  TE.tryCatch(() => signInWithPopup(auth, provider), E.toError);

function App() {
  const [userO, setUserO] = useState<O.Option<UserCredential>>(O.none);

  const handleSignIn = React.useCallback(
    pipe(
      SignInWithPopupTE(auth, provider),
      TE.chainFirstIOK(log),
      TE.chainIOK(flow(O.some, setUserO, IO.of))
    ),
    []
  );

  return (
    <div className="App">
      {pipe(
        userO,
        O.fold(
          () => <LoginPage onLogin={handleSignIn} />,
          (user) => <AuthenticatedApplication user={user} />
        )
      )}
    </div>
  );
}

export type AuthContext = {
  user: UserCredential;
};

export const ApplicationContext = React.createContext<O.Option<AuthContext>>(
  O.none
);

export const AuthenticatedApplication: React.FC<{ user: UserCredential }> = ({
  user,
}) => (
  <ApplicationContext.Provider value={O.some({ user })}>
    <div>
      <Navbar expand="lg" className="bg-body-tertiary">
        <Container>
          <Navbar.Brand href="#home">
            <img
              src="/parking.svg" // Replace with the path to your SVG logo
              width="40"
              height="40"
              className="d-inline-block align-top"
              alt="Logo"
            />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="#home">Sessions</Nav.Link>
            </Nav>
          </Navbar.Collapse>
          <Navbar.Collapse className="justify-content-end">
            <Navbar.Text>
              Signed in as: <a href="#login">{user.user.displayName}</a>
            </Navbar.Text>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <SessionsPage />
    </div>
  </ApplicationContext.Provider>
);

export default App;
