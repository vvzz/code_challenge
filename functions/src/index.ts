import { onRequest } from "firebase-functions/v2/https";
import { Response } from "express";
import * as express from "express";
import * as cors from "cors";
import * as admin from "firebase-admin";


type EntryType = {
  title: string,
  text: string,
  coverImageUrl: string
}

type Request = {
  body: EntryType,
  params: { entryId: string }
}

admin.initializeApp();

const addEntry = async (req: Request, res: Response) => {
  const db = admin.firestore();

  const { title, text } = req.body;
  try {
    const entry = db.collection("entries").doc();
    const entryObject = {
      id: entry.id,
      title,
      text,
    };

    entry.set(entryObject);

    res.status(200).send({
      status: "success",
      message: "entry added successfully",
      data: entryObject,
    });
  } catch (error) {
    res.status(500).json("We found an error posting your request!");
  }
};


const server = express();
server.use(cors({ origin: true }));

server.get("/", (req, res) => res.status(200).send("Hey there!"));
server.post("/entries", addEntry);


export const api = onRequest(
  server,
);

export const health = onRequest((request, response) => {
  response.status(200).send("ok");
});
