import { completeSession, createSession, listSessions } from "actions";
import * as cors from "cors";
import * as express from "express";
import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";

admin.initializeApp();
const db = admin.firestore();

const server = express();
server.use(cors({ origin: true }));

server.post("/listSessions", (req, res) =>
  listSessions({ req, res, firestore: db })()
);
server.post("/createSession", (req, res) =>
  createSession({ req, res, firestore: db })()
);
server.post("/completeSession", (req, res) =>
  completeSession({ req, res, firestore: db })()
);

export const api = onRequest(server);

export const health = onRequest((request, response) => {
  response.status(200).send("ok");
});
