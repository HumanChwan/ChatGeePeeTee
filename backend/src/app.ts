import express, { Express } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import { CLIENT_URL } from "./config/config";
import { login, logout, signup } from "./controllers/authentication";

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

app.get('/signup', signup)
app.get('/login', login)
app.get('/logout', logout)

export default app;
