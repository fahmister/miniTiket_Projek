import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import { IUserReqParam } from "../custom";
import { SECRET_KEY } from "../config";

async function VerifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        // Get the token from the request header
        // The token is expected to be in the format "Bearer <token>"
        // Split the token to get the actual token string
        const token =  req.cookies?.access_token ||
                        req.header("Authorization")?.replace("Bearer ", "")  

        if (!token) {
             res.status(401).json({ error: "Unauthorized" });
             return;
        }

        // Verify the token using the secret key
        // The verify function checks the token against the secret key
        // const verifyUser = verify(token, String(SECRET_KEY)) as IUserReqParam;
        // if (!verifyUser) throw new Error("Invalid Token");
        // req.user = verifyUser as IUserReqParam;

        const decoded = verify(token, String(SECRET_KEY)) as Partial<IUserReqParam>;
        if (!decoded.id || !decoded.first_name || !decoded.last_name || !decoded.roleName){
            res.status(401).json({ error: "Invalid Token" });
            return;
        }

        req.user = decoded as IUserReqParam;
        next();
    } catch (err) {
       console.error('Authentication error:', err);
       res.status(401).json({ error: "Invalid Token" });
       return;
    }
}

async function EOGuard(req: Request, res: Response, next: NextFunction) {
    try {
        // Add trim() and case normalization
        if (req.user?.roleName?.trim().toLowerCase() !== "event organizer") {
            throw new Error("Restricted");
        }
        next();
    } catch(err) {
        next(err)
    }
} 

export { VerifyToken, EOGuard }