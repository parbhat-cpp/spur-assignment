import type { Request } from "express";

export interface VerifiedRequest extends Request {
    user?: any;
}
