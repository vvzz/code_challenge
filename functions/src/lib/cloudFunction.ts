import { Request, Response } from "express";
import { pipe } from "fp-ts/function";
import * as RT from "fp-ts/ReaderTask";
import { DataResponse } from "./models/APISuccess";

export type FunctionContext = {
  req: Request;
  res: Response;
};
export const handleCloudFunctionError = (e: Error) =>
  pipe(
    RT.ask<FunctionContext>(),
    RT.chainIOK(({ res }) => () => {
      res.status(500).send({ error: e.message });
    })
  );
export const handleCloudFunctionSuccess = <T>(data: DataResponse<T>) =>
  pipe(
    RT.ask<FunctionContext>(),
    RT.chainIOK(({ res }) => () => {
      res.status(200).send({ status: "success", ...data });
    })
  );
