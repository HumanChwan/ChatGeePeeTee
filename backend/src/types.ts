import { Request } from "express";

export type AuthenticatedUserRequest = Request & { userId: string };
