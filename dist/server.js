"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
// NPM
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const body_parser_1 = __importDefault(require("body-parser"));
const mongoose_1 = __importDefault(require("mongoose"));
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const csurf_1 = __importDefault(require("csurf"));
const connect_flash_1 = __importDefault(require("connect-flash"));
const multer_1 = __importDefault(require("multer"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
// App Imports
const User_1 = __importDefault(require("./models/User"));
const handleError_1 = require("./middleware/handleError");
// Routes
const admin_1 = __importDefault(require("./routes/admin"));
const shop_1 = __importDefault(require("./routes/shop"));
const auth_1 = __importDefault(require("./routes/auth"));
// Controllers
const error_1 = require("./controllers/error");
const MOGNODB_URI = process.env.CONNECTION_STRING;
// APP SETUP
const app = (0, express_1.default)();
const store = connect_mongo_1.default.create({
    mongoUrl: MOGNODB_URI,
});
const csrfProtection = (0, csurf_1.default)();
// MULTER CONFIG
const fileStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images");
    },
    filename: (req, file, cb) => {
        cb(null, new Date().valueOf() + "-" + file.originalname);
    },
});
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
        cb(null, true);
    }
    else {
        cb(new Error("Only jpeg, jpg & png files are allowed."));
    }
};
// MORGAN CONFIG
const accessLogStream = fs_1.default.createWriteStream(path_1.default.join(__dirname, "access.log"), { flags: "a" });
// VIEW CONFIG
app.set("view engine", "ejs");
app.set("views", path_1.default.join(__dirname, "views"));
// Middleware
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)("combined", { stream: accessLogStream }));
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use((0, multer_1.default)({ storage: fileStorage, fileFilter }).single("image"));
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
app.use("/images", express_1.default.static(path_1.default.join(__dirname, "../images")));
app.use((0, express_session_1.default)({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store,
}));
app.use(csrfProtection);
app.use((0, connect_flash_1.default)());
// ADD USER DATA TO REQ
app.use(async (req, res, next) => {
    if (!req.session.user)
        return next();
    try {
        const user = await User_1.default.findById(req.session.user?._id);
        if (!user)
            return next();
        req.user = user;
        next();
    }
    catch (error) {
        next((0, handleError_1.getError)(error));
    }
});
// AUTH
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});
// Routes
app.use("/admin", admin_1.default);
app.use(shop_1.default);
app.use(auth_1.default);
app.get("/500", error_1.get500);
app.use(error_1.get404);
app.use(handleError_1.handleError);
async function run() {
    try {
        await mongoose_1.default.connect(MOGNODB_URI);
        app.listen(process.env.PORT);
    }
    catch (error) {
        throw (0, handleError_1.getError)(error);
    }
}
run();
