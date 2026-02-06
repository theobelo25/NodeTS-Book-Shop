"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuth = void 0;
const isAuth = (req, res, next) => {
    if (!req.session.isLoggedIn)
        return res.redirect("/login");
    next();
};
exports.isAuth = isAuth;
