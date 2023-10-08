import { AuthProvider } from "@firebase/auth";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { initializeApp } from "firebase/app";
import {
  Auth,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  User,
  signOut,
} from "firebase/auth";
import { log } from "fp-ts/Console";
import * as E from "fp-ts/Either";
import { flow, pipe } from "fp-ts/function";
import * as IO from "fp-ts/IO";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import React, { useEffect, useState } from "react";
import { Button, Container, Navbar } from "react-bootstrap";
import { SessionsController } from "./controllers/SessionsController";
import { ApiContext } from "./contexts/ApiContext";
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
  TE.tryCatch(
    () =>
      setPersistence(auth, browserSessionPersistence).then(() =>
        signInWithPopup(auth, provider)
      ),
    E.toError
  );

export const SignOutTE = (auth: Auth) =>
  TE.tryCatch(() => signOut(auth), E.toError);

function App() {
  const [userO, setUserO] = useState<O.Option<User>>(O.none);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => pipe(user, O.fromNullable, setUserO));
  }, []);

  const handleSignIn = React.useCallback(
    () =>
      pipe(
        SignInWithPopupTE(auth, provider),
        TE.chainFirstIOK(log),
        TE.chainIOK(
          flow(
            O.some,
            O.map((_) => _.user),
            setUserO,
            IO.of
          )
        )
      )(),
    []
  );
  const handleSignOut = React.useCallback(
    () =>
      pipe(
        SignOutTE(auth),
        TE.chainIOK(() => () => {
          setUserO(O.none);
        })
      )(),
    []
  );

  return (
    <div className="App">
      {pipe(
        userO,
        O.fold(
          () => <LoginPage onLogin={handleSignIn} />,
          (user) => (
            <AuthenticatedApplication user={user} onSignout={handleSignOut} />
          )
        )
      )}
    </div>
  );
}

export type AuthContext = {
  user: User;
};

export const ApplicationContext = React.createContext<AuthContext & ApiContext>(
  null as never
);

export const ApplicationNavBar: React.FC<{ onSignOut: () => void }> = (
  props
) => {
  const appContext = React.useContext(ApplicationContext);

  return (
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
        <Navbar.Collapse className="justify-content-end">
          <Navbar.Text>
            Signed in as: <strong>{appContext.user.displayName}</strong>
          </Navbar.Text>
          <Button
            variant="outline-secondary"
            onClick={props.onSignOut}
            style={{ marginLeft: "1em" }}
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
          </Button>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export const AuthenticatedApplication: React.FC<{
  user: User;
  onSignout: () => void;
}> = ({ user, onSignout }) => {
  return (
    <ApplicationContext.Provider
      value={{
        user,
        apiURL: "http://127.0.0.1:5001/vend-park-challenge/us-central1/api",
      }}
    >
      <div>
        <ApplicationNavBar onSignOut={onSignout} />
        <SessionsController>
          <SessionsPage />
        </SessionsController>
      </div>
    </ApplicationContext.Provider>
  );
};

export default App;
