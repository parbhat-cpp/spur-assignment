import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';

import { VerifiedRequest } from "../types/req.types";

export const isAuth = (req: VerifiedRequest, res: Response, next: NextFunction) => {
    const token: string = req.cookies.token as string;

    if (!token) {
        res.status(httpStatus.UNAUTHORIZED).send({
            error: 'Access Denied: No token provided',
        });
        return;
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        // Attach user to request
        req.user = decoded;
        next();
    } catch (error) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
            error: 'Invalid token',
        });
    }
}
