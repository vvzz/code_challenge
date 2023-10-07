import { Response, Request } from "express";
import { pipe } from "fp-ts/function";
import * as RT from "fp-ts/ReaderTask";

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
export const handleCloudFunctionSuccess = (data: unknown) =>
  pipe(
    RT.ask<FunctionContext>(),
    RT.chainIOK(({ res }) => () => {
      res.status(200).send({ status: "success", data });
    })
  );
