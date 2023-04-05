import fs from "fs";
import { config } from "dotenv";

// Check if environment exists
if (fs.existsSync(".env")) {
    console.log("[+] Found `.env` file, assuming Environment variables exist");
    config();
}

// Get Environment Variables
export const ENVIRONMENT = process.env.NODE_ENV;
export const __prod__ = ENVIRONMENT === "production";

export const PORT = Number(process.env.PORT) || 5000;
export const CLIENT_URL = process.env.CLIENT_URL as string;

// TODO: secure being true is hard to implement perhaps
export const COOKIE_CONFIG = {
    httpOnly: true,
    secure: __prod__,
};
