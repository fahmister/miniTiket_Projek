import { Request, Response, NextFunction } from "express";
import { RegisterService, LoginService, GetAll } from "../services/auth.service";

import { IUserReqParam } from "../custom";

async function RegisterController (req: Request, res: Response, next: NextFunction) {
    try {
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

export { RegisterController, LoginController, UsersController }