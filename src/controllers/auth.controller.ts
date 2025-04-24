import { Request, Response, NextFunction } from "express";
import { RegisterService, LoginService, GetAll } from "../services/auth.service";

import { IUserReqParam } from "../custom";

// RegisterController function to handle user registration
// It takes the request, response, and next function as parameters

// If an error occurs, it calls the next function to handle the error
async function RegisterController (req: Request, res: Response, next: NextFunction) {
    try {
        // Validate the request body using the IRegisterParam interface
        // This ensures that the request body contains the required fields for registration
        const data = await RegisterService(req.body);

        res.status(200).send({
            message: "Register Berhasil",
            data
        })
    } catch(err) {
        next(err)
    }
}

async function LoginController (req: Request, res: Response, next: NextFunction) {
    try {
        const data = await LoginService(req.body);

        res.status(200).cookie("access_token", data.token).send({
            message: "Login Berhasil",
            user: data.user
        });
    } catch(err) {
        next(err)
    }
}

async function UsersController (req: Request, res: Response, next: NextFunction) {
    try {
        const user = req.user as IUserReqParam;
        console.log(user);
        const data = await GetAll();

        res.status(200).send({
            message: "Berhasil",
            users: data
        })
    } catch (err) {
        next(err);
    }
}

// Exporting the controllers to be used in routers directory
export { RegisterController, LoginController, UsersController }