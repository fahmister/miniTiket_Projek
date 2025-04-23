import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import { IUserReqParam } from "../custom";
import { SECRET_KEY } from "../config";

async function VerifyToken(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");

        if (!token) throw new Error("Unauthorized");

        const verifyUser = verify(token, String(SECRET_KEY));
        
        if (!verifyUser) throw new Error("Invalid Token");

        req.user = verifyUser as IUserReqParam;

        next();
    } catch (err) {
        next(err);
    }
}

async function EOGuard(req: Request, res: Response, next: NextFunction) {
    try {
        if (req.user?.roleId !== 1) throw new Error("Restricted"); // Assuming "Event Organizer" corresponds to roleId 1

        next();
    } catch(err) {
        next(err)
    }
} 

export { VerifyToken, EOGuard }