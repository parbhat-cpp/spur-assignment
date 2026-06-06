import { Request, Response } from "express";
import HttpStatus from "http-status";
import * as zod from "zod";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";

import { LoginSchema, SignUpSchema } from "../types/auth.types";
import { VerifiedRequest } from "../types/req.types";
import { db } from "..";
import { usersTable } from "../db/schema";
import { comparePassword, hashPassword } from "../utils/auth";

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = await zod.parseAsync(LoginSchema, req.body);

        const user = await db.select().from(usersTable).where(eq(usersTable.email, email));

        // check if user does not exists
        if (user.length === 0) {
            res.status(HttpStatus.NOT_FOUND).send({
                success: false,
                message: "User not found",
            });
            return;
        }

        const isMatch = await comparePassword(password, user[0].password);

        // password match check
        if (!isMatch) {
            res.status(HttpStatus.UNAUTHORIZED).send({
                success: false,
                message: "Invalid credentials",
            });
            return;
        }

        const userData = {
            id: user[0].id,
            email: user[0].email,
            fullname: user[0].fullname,
        }

        const token = jwt.sign(userData, process.env.JWT_SECRET as string, { expiresIn: '30d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            maxAge: 30 * 24 * 60 * 60 * 1000,
            sameSite: 'none',
            path: '/'
        });

        res.status(HttpStatus.OK).send({
            success: true,
            message: "Login successful",
            data: userData,
        });
    } catch (error) {
        if (error instanceof zod.ZodError) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: "Validation error",
                errors: error.issues,
            });
        }
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal server error",
            error,
        });
    }
};

export const signup = async (req: Request, res: Response) => {
    try {
        const { email, password, fullname } = await zod.parseAsync(SignUpSchema, req.body);

        const userExists = await db.select().from(usersTable).where(eq(usersTable.email, email));

        // check if user exists
        if (userExists.length > 0) {
            res.status(HttpStatus.CONFLICT).send({
                success: false,
                message: "User already exists",
            });
            return;
        }

        const hashedPassword = await hashPassword(password);

        // create a new user
        const user = await db.insert(usersTable).values({
            email,
            password: hashedPassword,
            fullname,
        }).returning();

        const userData = {
            id: user[0].id,
            email: user[0].email,
            fullname: user[0].fullname,
        }

        const token = jwt.sign(userData, process.env.JWT_SECRET as string, { expiresIn: '30d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            maxAge: 30 * 24 * 60 * 60 * 1000,
            sameSite: 'none',
            path: '/'
        });

        res.status(HttpStatus.CREATED).send({
            success: true,
            message: "User created successfully",
            data: userData,
        });
    } catch (error) {
        if (error instanceof zod.ZodError) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: "Validation error",
                errors: error.issues,
            });
        }
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal server error",
            error,
        });
    }
};

export const getUser = async (req: VerifiedRequest, res: Response) => {
    try {
        const req_user = req.user;
        const email = req.query.email as string;

        if (!email) {
            return res.status(HttpStatus.OK).json({ success: true, data: [] });
        }

        const users = await db.select({ fullname: usersTable.fullname, email: usersTable.email }).from(usersTable).where(eq(usersTable.email, email));
        
        res.status(HttpStatus.OK).json({ success: true, data: users });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to fetch user", error });
    }
};
