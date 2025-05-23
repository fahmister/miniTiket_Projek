import { Request, Response, NextFunction } from "express";
import { 
          FindUserByEmail,
          RegisterService, 
          LoginService, 
          GetAll, 
          UpdateUserService, 
          // UpdateUserService2, 
          UserPasswordService,
          ActivateUserService,
          verifyResetTokenService
        } from "../services/auth.service";

import { IUserReqParam } from "../custom";
import { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";

// RegisterController function to handle user registration
// It takes the request, response, and next function as parameters

// If an error occurs, it calls the next function to handle the error
async function RegisterController(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
    try {
        // Validate the request body using the IRegisterParam interface
        // This ensures that the request body contains the required fields for registration
        const data = await RegisterService(req.body);
        
        const roleId = typeof req.body.roleId === 'string' 
          ? parseInt(req.body.roleId) 
          : req.body.roleId;
        // Validate roleId is 1 or 2
        if (![1, 2].includes(roleId)) {
        res.status(400).send({ error: "Invalid role ID" });
        }
        
        res.status(200).send({
            message: "Register Successfully",
            data
        })
    } catch(err) {
        next(err)
    }
}

async function ActivationController(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  try {
      const result = await ActivateUserService(req.params.token);
      res.status(200).json(result);
  } catch (err) {
    if (err instanceof Error) {
        res.status(400).json({ err: err.message });
    } else {
        res.status(400).json({ err: "An unknown error occurred" });
    } next(err)
  }
}

async function LoginController (
  req: Request, 
  res: Response, 
  next: NextFunction
) {
    try {
        const data = await LoginService(req.body);

        const { user, token } = data; // Extract user and token from data

        // Set secure, httpOnly cookie
        res.cookie('access_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 * 1000 // 1 week
        });

        res.status(200).json({
          message: "Login successful",
          token: token, // Ensure the token is returned from LoginService
          user: {
            id: user.id,
            first_name: user.first_name,
            roleName: user.roleName // Ensure roleName is used correctly
          }
      });
    } catch(err) {
        next(err)
    }
}

// In Postman, Authorization testing
async function EODashboardController(
  req: Request,
  res: Response,
  next: NextFunction
  ) {
    try {
      res.status(200).json({
        message: "Welcome to Event Organizer Dashboard",
        user: req.user
    })
  } catch(err) {
        next(err)
    }
}

async function UpdateProfileController(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { file } = req;
      const { email } = req.user as IUserReqParam;
      if (!file) throw new Error("file not found");

      // This now returns the Cloudinary filename
      const cloudinaryUrl: string = await UpdateUserService(file, email);
      if (typeof cloudinaryUrl !== 'string' || !cloudinaryUrl) {
        throw new Error("Invalid response from UpdateUserService");
      }
      const splitUrl = cloudinaryUrl.split('/');
      const cloudinaryPath = splitUrl.slice(splitUrl.indexOf('upload') + 1).join('/');
      
      res.status(200).send({
        message: "Profile update successfully",
        fileName: cloudinaryPath // e.g. "v12345/profile.jpg"
      });
    } catch (err) {
      next(err);
    }
  }

  async function getCurrentUserController(
    req: Request, 
    res: Response, 
    next: NextFunction
  ): Promise<void> {
  try {
    if (!req.user) {
      res.status(400).json({ message: "User is not authenticated" });
      return;
    }
    const user = await FindUserByEmail(req.user.email);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    
    // Return necessary user data without sensitive information
    const userData = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      profile_picture: user.profile_picture || null, // Ensure profile_picture is optional
      roleName: user.role.name,
      referral_code: user.referral_code,
      user_points: user.user_points,
      discount_coupons: user.discount_coupons,
      expiry_points: user.expiry_points,
      PointTransactions: user.PointTransactions,
    };

    res.status(200).json(userData);
  } catch (err) {
    next(err);
  }
}

  // async function UpdateProfileController2(
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ) {
  //   try {
  //     const { file } = req;
  //     const { email } = req.user as IUserReqParam;
  //     // console.log(file);
  //     if (!file) throw new Error("file not found");
  //     await UpdateUserService2(file, email);
  
  //     res.status(200).send({
  //       message: "Profile update successfully",
  //     });
  //   } catch (err) {
  //     next(err);
  //   }
  // }

async function GetAllController (
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

      res.status(200).json({ message: "Password Changed Successfully" });
    } catch (err) {
      console.error('Password change error:', err);
      if (err instanceof Error && err.message === 'User not found') {
          res.status(404).send({ message: err.message });
      }
      if (err instanceof Error && err.message === 'Current password is incorrect') {
          res.status(400).send({ message: err.message });
      }
      next(err)
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

async function VerifyResetTokenController (
  req: Request, 
  res: Response, 
  next: NextFunction
):Promise<void> {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: "Token is required" });
    }

    const result = await verifyResetTokenService(token);
    res.status(200).json(result);
  } catch (err: any) {
    console.error('Token verification error:', err);

  if (err instanceof TokenExpiredError) {
      res.status(400).json({ error: "Token has expired" });
    } else if (err instanceof JsonWebTokenError) {
      res.status(400).json({ error: "Invalid token" });
    } else if (err.message.includes('Invalid') || err.message.includes('expired')) {
      res.status(400).json({ error: err.message });
    } next(err);
    
    res.status(500).json({ error: "Internal server error" });
  } 
}

// Exporting the controllers to be used in routers directory
export { 
  RegisterController, 
  ActivationController,
  LoginController,
  EODashboardController, 
  GetAllController, 
  UpdateProfileController,
  getCurrentUserController, 
  // UpdateProfileController2,
  VerifyResetTokenController
};