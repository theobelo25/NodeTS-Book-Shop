"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = exports.AppError = void 0;
class AppError extends Error {
    httpStatusCode;
}
exports.AppError = AppError;
const handleError = (err, status, next, message) => {
    let errorMessage = "An unknown error occurred";
    if (message)
        errorMessage = message;
    if (typeof err === "string")
        errorMessage = err;
    if (err instanceof Error)
        errorMessage = err.message;
    const error = new AppError(errorMessage);
    error.httpStatusCode = status;
    return next(error);
};
exports.handleError = handleError;
