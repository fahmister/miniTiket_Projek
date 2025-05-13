import { IRegisterParam, ILoginParam, IAuthService} from "../interface/user.interface";
import prisma from "../lib/prisma";
import { hash, genSaltSync, compare } from "bcrypt";
import { cloudinaryUpload, cloudinaryRemove } from "../utils/cloudinary";
import { sign, verify, TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";
import {processReferralRewards} from "./referralrewards.services";
import { sendVerificationEmail } from "./verificationemail.service";
import { PasswordService } from './password.service';
import { EmailService } from './passwordemail.service';

import { SECRET_KEY } from "../config";

// Get all users from database via connection pool (prisma)
// Other application from GetAll is to see the history of event created by EO
async function GetAll() {
  try {
    return await prisma.users.findMany();
  } catch(err) {
    throw err;
  }
}

// Function to find a user by email in database via connection pool (prisma)
// This function takes an email as a parameter and returns a promise of type Users | null
// It uses the Prisma Client to query the database for a user with the given email
async function FindUserByEmail(email: string) {
  try {
    // find First is used to find the first record that matches the given criteria
    const users = await prisma.users.findFirst({
      // select to get the specific fields to return
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        password: true,
        roleId: true,
        role: {
          select: {
            name: true,
          },
        },
        profile_picture: true,
        referral_code: true,
        user_points: true,
        discount_coupons: true,
        expiry_points: true,
      },
      where: {
        email,
      },
      // lines 24 & 37-39 same as this query: select * from user where email = email limit 1
    });

    return users;
  } catch (err) {
    throw err;
  }
}

// Function to register a new user
// This async function takes a parameter of type IRegisterParam and returns a promise of type Users

// Define a default role ID
const defaultRoleId = 1; // Replace 1 with the actual default role ID from your database
async function RegisterService(param: IRegisterParam) {
  try {
    // validate email already registered and select * from user where email = email limit 1
    const isExist = await FindUserByEmail(param.email);
    if (isExist) throw new Error("Email is already registered");

    // Create roles if they don't exist
    await prisma.role.createMany({
      data: [
        { id: 1, name: 'Customer' },
        { id: 2, name: 'Event Organizer' }
      ],
      skipDuplicates: true
    });

    // hash the password using bcrypt (hash, getSaltSync)
    const salt = genSaltSync(10);
    const hashedPassword = await hash(param.password, salt);
      
    // insert into user table in prisma database
    // (first_name, last_name, email, password, is_verified, etc) 
    return await prisma.$transaction(async (tx) => {
   
    // Check if referral code exists if provided. 
    // User can provide a referral code when account registering or leave it empty
    let referringUserId: number | null = null;
    // 1. Check referral code 
    // If referral code is provided, find the user with that code
    if (param.referred_by) {
      const referringUser = await tx.users.findFirst({
        where: { 
          referral_code: param.referred_by, // Match against referral_code
          id: { not: param.id ? parseInt(param.id, 10) : undefined } // Ensure user can't refer themselves
        }
      });
      
      if (!referringUser) {
        throw new Error('Invalid referral code');
      }
      referringUserId = referringUser.id;
    }
    // Check if the referring user exists in the database
    const referringUserExists = await prisma.users.findUnique({
      where: { referral_code: param.referred_by }
    });
    console.log('Referring user exists:', referringUserExists);
    // ensure the referral code is valid and not empty
    console.log('Attempting to use referral code:', param.referred_by);
    // Additional Validation referred_by
    if (param.referred_by) {
      const codeValid = await prisma.users.count({
        where: { referral_code: param.referred_by }
      });
      
      if (codeValid === 0) {
        throw new Error('The referral code does not exist');
      }
    }
    
    // 2. Create user - changed referred_by to use number directly
    const user = await tx.users.create({
      data: {
        first_name: param.first_name,
        last_name: param.last_name,
        email: param.email,
        password: hashedPassword,
        is_verified: false,
        roleId: param.roleId || defaultRoleId, // Default role ID or User can provide a custom one (2)
        user_points: 0, // Default value for user_points
        expiry_points: new Date(new Date().setMonth(new Date().getMonth() + 3)), // 3 months expiry,
        referred_by: referringUserId,
        referral_code: "",
        },
      });
      // lines 119-133 insert into user table in prisma database
      
      // 3. Generate and update the user's own referral code
      const finalReferralCode = `TIX-${user.id.toString().padStart(6, '0')}`;
      await tx.users.update({
        where: { id: user.id },
        data: { referral_code: finalReferralCode },
      });

      // 4. Process referral rewards if applicable
      if (referringUserId) {
      try {
        await processReferralRewards(tx, user.id, referringUserId, user.email);
      } catch (referralError) {
        console.error('Referral reward processing failed:', referralError);
        // Continue registration even if rewards fail
      }
    }
      // Generate verification token
      // payload is the data that will be included in the JWT token
      const payload = { email: user.email };
      const token = sign(payload, String(SECRET_KEY), { expiresIn: "15m"});
      // 5. Send verification notification email
      await sendVerificationEmail(param.email, token);
    
      return user;
    }, {
      maxWait: 20000, // Maximum time to wait for the transaction (20 seconds)
      timeout: 15000  // Maximum time the transaction can run (15 seconds)
    });
  } catch (error) {
    console.error('Registration error:', error);
    throw new Error(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// function to activate user account
// This function takes a token as a parameter and returns a promise of type Users | null
async function ActivateUserService(token: string) {
  try {
    // Verify the JWT token
    const decoded = verify(token, String(SECRET_KEY)) as { email: string, type?: string };
    
    // Reject if this is a password reset token
    if (decoded.type === 'password_reset') {
      throw new Error("Invalid activation token");
    }

    // First, check if user exists
    const user = await prisma.users.findUnique({
      where: { email: decoded.email }
    });
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // If already verified, return success response
    if (user.is_verified) {
      return {
        success: true,
        message: "Account was already verified",
        user
      };
    }

    // Update the user's verification status
    const updatedUser = await prisma.users.update({
      where: {
        email: decoded.email
      },
      data: {
        is_verified: true
      }
    });

    return {
      success: true,
      message: "Account successfully activated",
      user: updatedUser
    };
  } catch (err) {
    // Handle different error cases
    if (err instanceof TokenExpiredError) {
      throw new Error("Activation link has expired");
    } else if (err instanceof JsonWebTokenError) {
      throw new Error("Invalid activation token");
    }
    throw err;
  }
}

async function LoginService(param: ILoginParam) {
  try {
    const users = await FindUserByEmail(param.email);

    if (!users) throw new Error("Email is not registered");

    // compare is used to compare the password from user input with the hashed password in the database
    const checkPass = await compare(param.password, users.password);

    if (!checkPass) throw new Error("Incorrect password");

    // payload is the data that will be included in the JWT token
    const payload = {
      id: users.id,
      email: users.email,
      first_name: users.first_name,
      last_name: users.last_name,
      roleName: users.role.name,
      profile_picture: users.profile_picture || "", // Ensure profile_picture is optional
      referral_code: users.referral_code, // Add these
      user_points: users.user_points,
      expiry_points: users.expiry_points,
      discount_coupons: users.discount_coupons || [],
    }

    // sign is used to create a JWT token with the user's informatio
    // The token is signed with a secret key and has an expiration time of 1 hour
    const token = sign(payload, String(SECRET_KEY), { expiresIn: "1h"});

    return {user: payload, token};
  } catch (err) {
    throw err;
  }
}

async function UpdateUserService(file: Express.Multer.File, email: string): Promise<string> {
  try {
    const checkUser = await FindUserByEmail(email);
    if (!checkUser) throw new Error("User not found");

    // Upload to Cloudinary
    const { secure_url } = await cloudinaryUpload(file);

    if (!secure_url) {
      throw new Error("Failed to upload to Cloudinary");
    }

    const splitUrl = secure_url.split("/");
    // splitUrl.length - 1 to get the last part of the URL
    const fileName = splitUrl.slice(-2).join('/');
    
    const result = await prisma.$transaction(async (t: any) => {
      // where is used to find the user by email and update the profile_picture field with the fileName
      await t.users.update({
        where: {
          email: email
        },
        data: {
          profile_picture: fileName
        },
      });

      return secure_url; // Return the full URL for the controller to process
    });

    return result; // Ensure the function always returns the secure_url
  } catch (err) {
    throw err;
  }
}

// async function UpdateUserService2(file: Express.Multer.File, email: string) {
//   try {
//     const checkUser = await FindUserByEmail(email);

//     if (!checkUser) throw new Error("User not found");

//     await prisma.$transaction(async (t: any) => {
//       await t.users.update({
//         where: {
//           email: checkUser.email,
//         },
//         data: {
//           profile_picture: file.filename,
//         },
//       });
//     });
//   } catch (err) {
//     throw err;
//   }
// }



async function VerifyUserService() {
  try {
    console.log("this function is running");
    await prisma.$transaction(async (t: any) => {
      await t.users.updateMany({
        where: {
          is_verified: false
        },
        data: {
          is_verified: true,
        },
      });
    });
  } catch (err) {
    throw err;
  }
}

const passwordService = new PasswordService();
const emailService = new EmailService();

export class UserPasswordService implements IAuthService {
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { password: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isMatch = await passwordService.comparePasswords(currentPassword, user.password);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = await passwordService.hashPassword(newPassword);

    await prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, email: true }
    });

    if (!user) {
      // Don't reveal whether user exists for security
      return;
    }

    const resetToken = await passwordService.generateResetToken(user.id);
    await emailService.sendPasswordResetEmail(user.email, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const { userId } = await passwordService.verifyResetToken(token);

    const hashedPassword = await passwordService.hashPassword(newPassword);

    await prisma.$transaction([
      prisma.users.update({
        where: { id: userId },
        data: { password: hashedPassword }
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId }
      })
    ]);
  }
}


async function verifyResetTokenService(token: string) {
  try {
    if (!token) {
      throw new Error("Token is required");
    }

    // First verify the JWT
    const decoded = verify(token, String(SECRET_KEY)) as { userId: number };
    
    // Then check if the token exists in the database and isn't expired
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() }
      }
    });

    if (!resetToken) {
      throw new Error("Invalid or expired token");
    }

    return { valid: true, userId: decoded.userId };
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      throw new Error("Token has expired");
    } else if (err instanceof JsonWebTokenError) {
      throw new Error("Invalid token");
    }
    throw err; // Re-throw other errors
  }
}

// Exporting the functions to be used in controllers directory
export { 
  FindUserByEmail,
  GetAll,
  RegisterService, 
  ActivateUserService,
  LoginService,
  UpdateUserService,
  // UpdateUserService2,
  VerifyUserService,
  verifyResetTokenService
};