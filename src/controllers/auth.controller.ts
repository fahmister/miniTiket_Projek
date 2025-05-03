import { Request, Response, NextFunction } from "express";
import { RegisterService, LoginService, GetAll, UpdateUserService, UpdateUserService2, UserPasswordService } from "../services/auth.service";
import { IUserReqParam } from "../custom";

// RegisterController function to handle user registration
// It takes the request, response, and next function as parameters

// If an error occurs, it calls the next function to handle the error
async function RegisterController (
  req: Request, 
  res: Response, 
  next: NextFunction
) {
    try {
        // Validate the request body using the IRegisterParam interface
        // This ensures that the request body contains the required fields for registration
        const data = await RegisterService(req.body);

        res.status(200).send({
            message: "Register Successfully",
            data
        })
    } catch(err) {
        next(err)
    }
}

async function LoginController (
  req: Request, 
  res: Response, 
  next: NextFunction
) {
    try {
        const data = await LoginService(req.body);

        res.status(200).cookie("access_token", data.token).send({
            message: "Login Successfully",
            user: data.user
        });
    } catch(err) {
        next(err)
    }
}

async function UpdateProfileController(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { file } = req;
      const { email } = req.user as IUserReqParam;
      if (!file) throw new Error("file not found");
      await UpdateUserService(file, email);
  
      res.status(200).send({
        message: "Profile update successfully",
      });
    } catch (err) {
      next(err);
    }
  }

  async function UpdateProfileController2(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { file } = req;
      const { email } = req.user as IUserReqParam;
      // console.log(file);
      if (!file) throw new Error("file not found");
      await UpdateUserService2(file, email);
  
      res.status(200).send({
        message: "Profile update successfully",
      });
    } catch (err) {
      next(err);
    }
  }

async function UsersController (
  req: Request, 
  res: Response, 
  next: NextFunction
) {
    try {
        const user = req.user as IUserReqParam;
        console.log(user);
        const data = await GetAll();

        res.status(200).send({
            message: "Successfully get all users",
            users: data
        })
    } catch (err) {
        next(err);
    }
}

const authService = new UserPasswordService();
export const AuthPasswordController = {
  async changePassword(req: Request, res: Response, next: NextFunction):Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!req.user) {
        res.status(400).send({ message: 'User is not authenticated' });
        return;
      }
      const userId = (req.user as IUserReqParam).id;

      if (typeof userId !== 'number') {
        res.status(400).send({ message: 'Invalid user ID' });
        return;
      }

      await authService.changePassword(userId, currentPassword, newPassword);

      res.status(200).send({ message: "Password reset successful" });
    } catch (err) {
      console.error('Password change error:', err);
      if (err instanceof Error && err.message === 'User not found') {
          res.status(404).send({ message: err.message });
      }
      if (err instanceof Error && err.message === 'Current password is incorrect') {
          res.status(400).send({ message: err.message });
      }
      next()
    }
  },

  async requestPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      await authService.requestPasswordReset(email);

      res.status(200).send({ message: 'If an account with that email exists, a password reset link has been sent' });
    } catch (err) {
      console.error('Password reset request error:', err);
      next()
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction):Promise<void> {
    try {
      const { token, newPassword } = req.body;
      await authService.resetPassword(token, newPassword);

      res.status(200).send({ message: 'Password reset successfully' });
    } catch (err) {
      console.error('Password reset error:', err);
      if (err instanceof Error && err.message === 'Invalid or expired token') {
        res.status(400).send({ message: err.message });
      }
      next()
    }
  }
}


// Exporting the controllers to be used in routers directory
export { 
  RegisterController, 
  LoginController, 
  UsersController, 
  UpdateProfileController, 
  UpdateProfileController2,
};