import express, { Express } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import { CLIENT_URL } from "./config/config";

import authenticationRouter from "./routers/authentication";
import chatRouter from "./routers/chat";

import path from "path";

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

app.use(express.static(path.join("public")));

app.use("/auth", authenticationRouter);
app.use("/chat", chatRouter);

export default app;
