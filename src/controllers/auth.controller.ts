import { Request, Response, NextFunction } from "express";
import { RegisterService, LoginService, GetAll, UpdateUserService, UpdateUserService2 } from "../services/auth.service";
import { processReferralRewards } from "../services/referralrewards.services";
import { IUserReqParam } from "../custom";
import prisma from "../lib/prisma"; // Import the Prisma client instance

// RegisterController function to handle user registration
// It takes the request, response, and next function as parameters

// If an error occurs, it calls the next function to handle the error
async function RegisterController (req: Request, res: Response, next: NextFunction) {
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

async function LoginController (req: Request, res: Response, next: NextFunction) {
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

// This route is for testing purposes only and should not be used in production
// It processes referral rewards for a new user and their referring user
async function ReferralController (req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Add validation for required fields
    if (!req.body || !req.body.referringUserId || !req.body.newUserId || !req.body.newUserEmail) {
      res.status(400).json({ 
        error: 'Missing required fields',
        required: ['referringUserId', 'newUserId', 'newUserEmail'],
        received: req.body
      });
    }

    const { referringUserId, newUserId, newUserEmail } = req.body;
    
    await prisma.$transaction(async (tx) => {
      await processReferralRewards(tx, newUserId, referringUserId, newUserEmail);
    });
    
    res.json({ 
      success: true,
      message: 'Referral rewards processed successfully'
    });
  } catch (error) {
    console.error('Error in /test/referral:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    });
  }
};

// Exporting the controllers to be used in routers directory
export { 
  RegisterController, 
  LoginController, 
  UsersController, 
  UpdateProfileController, 
  UpdateProfileController2, 
  ReferralController
};