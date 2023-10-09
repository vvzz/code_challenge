import { Request } from "express";
import { Auth } from "firebase-admin/lib/auth";
import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as s from "fp-ts/string";
import { FunctionContext } from "lib/cloudFunction";
import { not } from "fp-ts/lib/Predicate";

export type AuthContext = {
  auth: Auth;
};

export const getAuthorizationHeader = (req: Request) =>
  pipe(
    req.headers.authorization,
    E.fromNullable(new Error("No Authorization Header"))
  );

export const getBearerToken = (header: string) =>
  pipe(
    header.split(" "),
    A.lookup(1),
    O.filter(not(s.isEmpty)),
    E.fromOption(() => new Error("No Bearer Token"))
  );

export const getIdToken = pipe(
  RTE.ask<FunctionContext>(),
  RTE.chainEitherK(({ req }) =>
    pipe(req, getAuthorizationHeader, E.chain(getBearerToken))
  )
);

export const verifyIdToken = (idToken: string) =>
  pipe(
    RTE.ask<AuthContext>(),
    RTE.chainTaskEitherK(({ auth }) =>
      TE.tryCatch(() => auth.verifyIdToken(idToken), E.toError)
    )
  );

export const authenticate = pipe(getIdToken, RTE.chainW(verifyIdToken));
