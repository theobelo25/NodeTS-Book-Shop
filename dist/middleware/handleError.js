"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getError = exports.handleError = exports.AppError = void 0;
class AppError extends Error {
    httpStatusCode;
}
exports.AppError = AppError;
const handleError = (err, req, res, next) => {
    console.error(err);
    res.status(500).render("500", {
        pageTitle: "Error!",
        path: "/500",
        isAuthenticated: req.session.isLoggedIn,
    });
};
exports.handleError = handleError;
const getError = (err) => {
    let errorMessage = "An unknown error occurred";
    if (typeof err === "string")
        errorMessage = err;
    if (err instanceof Error)
        errorMessage = err.message;
    const error = new AppError(errorMessage);
    error.httpStatusCode = 500;
    return error;
};
exports.getError = getError;
