import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
dotenv.config();

// NPM
import express, { Request } from "express";
import session from "express-session";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import MongoStore from "connect-mongo";
import csrf from "csurf";
import flash from "connect-flash";
import multer, { FileFilterCallback } from "multer";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

// App Imports
import User, { IUser } from "./models/User";
import { handleError, getError } from "./middleware/handleError";

// Routes
import adminRoutes from "./routes/admin";
import shopRoutes from "./routes/shop";
import authRoutes from "./routes/auth";

// Controllers
import { get404, get500 } from "./controllers/error";

const MOGNODB_URI = process.env.CONNECTION_STRING!;

declare global {
  namespace Express {
    interface Request {
      user?: IUser | null;
    }
  }
}

declare module "express-session" {
  export interface SessionData {
    isLoggedIn: boolean;
    user?: IUser;
  }
}

// APP SETUP
const app = express();
const store = MongoStore.create({
  mongoUrl: MOGNODB_URI,
});
const csrfProtection = csrf();

// MULTER CONFIG
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().valueOf() + "-" + file.originalname);
  },
});
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const filetypes = /jpeg|jpg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only jpeg, jpg & png files are allowed."));
  }
};

// MORGAN CONFIG
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" },
);

// VIEW CONFIG
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan("combined", { stream: accessLogStream }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage, fileFilter }).single("image"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "../images")));

app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store,
  }),
);
app.use(csrfProtection);
app.use(flash());

// ADD USER DATA TO REQ
app.use(async (req, res, next) => {
  if (!req.session.user) return next();

  try {
    const user = await User.findById(req.session.user?._id);
    if (!user) return next();

    req.user = user;
    next();
  } catch (error: unknown) {
    next(getError(error));
  }
});

// AUTH
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Routes
app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.get("/500", get500);
app.use(get404);

app.use(handleError);

async function run() {
  try {
    await mongoose.connect(MOGNODB_URI);

    app.listen(process.env.PORT);
  } catch (error) {
    throw getError(error);
  }
}
run();
