import { completeSession, createSession, listSessions } from "./actions";
import * as cors from "cors";
import * as express from "express";
import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";

const app = admin.initializeApp();
const firestore = app.firestore();

const server = express();
server.use(cors({ origin: true }));

server.post("/listSessions", (req, res) =>
  listSessions({ req, res, firestore })()
);
server.post("/createSession", (req, res) =>
  createSession({ req, res, firestore })()
);
server.post("/completeSession", (req, res) =>
  completeSession({ req, res, firestore })()
);

export const api = onRequest(server);

export const health = onRequest((request, response) => {
  response.status(200).send("ok");
});
