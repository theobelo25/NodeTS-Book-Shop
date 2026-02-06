import { Request, Response, NextFunction, ErrorRequestHandler } from "express";

export class AppError extends Error {
  httpStatusCode?: number;
}

export const handleError: ErrorRequestHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(err);
  res.status(500).render("500", {
    pageTitle: "Error!",
    path: "/500",
    isAuthenticated: req.session.isLoggedIn,
  });
};

export const getError = (err: unknown) => {
  let errorMessage = "An unknown error occurred";
  if (typeof err === "string") errorMessage = err;
  if (err instanceof Error) errorMessage = err.message;

  const error = new AppError(errorMessage);
  error.httpStatusCode = 500;

  return error;
};
