import express, { Express } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import { CLIENT_URL } from "./config/config";

const app: Express = express();

// ----------MIDDLEWARES-----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// CORS
app.use(
    cors({
        origin: CLIENT_URL,
        credentials: true,
    })
);

export default app;
