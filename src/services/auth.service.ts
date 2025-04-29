import { IRegisterParam, ILoginParam,  } from "../interface/user.interface";
import prisma from "../lib/prisma";
import { hash, genSaltSync, compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { cloudinaryUpload, cloudinaryRemove } from "../utils/cloudinary";
import { Transporter } from "../utils/nodemailer";
import { verify, TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";

// Handlebars template engine
import Handlebars from "handlebars";
// path to join path with the file name
import path from "path";
// fs to read and manipulate files
import fs from "fs";

import { SECRET_KEY } from "../config";

// Define Percentage type as a number
type Percentage = number;

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
    // validate email already registered
    // select * from user where email = email limit 1
    const isExist = await FindUserByEmail(param.email);
    if (isExist) throw new Error("Email is already registered");

    await prisma.role.createMany({
      data: [
        { id: 1, name: 'Customer' },
        { id: 2, name: 'Event' }
      ],
      skipDuplicates: true
    });

    // hash the password using bcrypt (hash, getSaltSync)
    const salt = genSaltSync(10);
    const hashedPassword = await hash(param.password, salt);
      
    // insert into user table in prisma database
    // (first_name, last_name, email, password, isverified) 
    // values(param.first_name, param.last_name, param.email, param.password, false)
    return await prisma.$transaction(async (tx) => {

    // Check if referral code exists if provided
    // User can provide a referral code when account registering or leave it empty
    let referringUserId: string | null = null;
    
    if (param.referral_code) {
      const referringUser = await tx.users.findFirst({
        where: { 
          referral_code: param.referral_code,
          id: { not: param.id ? parseInt(param.id, 10) : undefined } // Ensure user can't refer themselves
        }
      });
      
      if (!referringUser) {
        throw new Error('Invalid referral code');
      }
      referringUserId = referringUser.id.toString();
    }
    
      // 1. Create user WITH referral code in the same operation
      const user = await tx.users.create({
        data: {
          first_name: param.first_name,
          last_name: param.last_name,
          email: param.email,
          password: hashedPassword,
          is_verified: false,
          roleId: defaultRoleId ? param.roleId : defaultRoleId, // Default role ID or User can provide a custom one (2)
          user_points: 0, // Default value for user_points
          expiry_points: new Date(new Date().setMonth(new Date().getMonth() + 3)), // 3 months expiry
          referral_code: param.referral_code || '',
          referred_by: referringUserId, // Set the referring user ID if exists
        },
      });
      // lines 109-122 insert into user table in prisma database
      
       // Generate and update the user's own referral code
      const finalReferralCode = `TIX-${user.id.toString().padStart(6, '0')}`;
      await tx.users.update({
        where: { id: user.id },
        data: { referral_code: finalReferralCode },
      });
// If referral was used, reward both users according to different conditions
if (referringUserId) {
  // 1. Reward the new registrant (referred user) with a discount coupon
  await tx.coupon.create({
    data: {
      user_id: user.id,
      code: `WELCOME-${Math.random().toString(36).substring(2, 10).toUpperCase()}`, // Generate random coupon code
      discount: 10 as number as Percentage, // 10% discount
      validUntil: new Date(new Date().setMonth(new Date().getMonth() + 3)), // 3 months validity
      isUsed: false,
      description: 'Sign-up bonus from referral program'
    }
  });

  // 2. Reward the referring user with 10,000 points
  await tx.users.update({
    where: { id: parseInt(referringUserId, 10) },
    data: { 
      user_points: { increment: 10000 } // 10,000 points for referrer
    }
  });

  // 3. Create transaction records for both actions
  await tx.pointTransactions.createMany({
    data: [
      {
        userId: user.id,
        amount: 0, // No points for new user
        type: 'REFERRAL_COUPON',
        description: 'Received welcome discount coupon'
      },
      {
        userId: referringUserId,
        amount: 10000,
        type: 'REFERRAL_BONUS',
        description: `Referral bonus for ${user.email}`
      }
    ]
  });

  // 4. Send notification to the referring user about their reward
  const referringUser = await tx.users.findUnique({
    where: { id: referringUserId },
    select: { email: true, first_name: true }
  });

  if (referringUser) {
    const templatePath = path.join(
      __dirname,
      "../templates",
      "referral-reward-notification.hbs"
    );
    const templateSource = fs.readFileSync(templatePath, "utf-8");
    const compiledTemplate = Handlebars.compile(templateSource);
    const html = compiledTemplate({
      name: referringUser.first_name,
      points: 10000,
      referredEmail: user.email
    });

    await Transporter.sendMail({
      from: "EOHelper Rewards",
      to: referringUser.email,
      subject: "You've earned referral points!",
      html
    });
  }
}

      // Generate verification token
      // payload is the data that will be included in the JWT token
      const payload = {email: user.email,};
      const token = sign(payload, String(SECRET_KEY), { expiresIn: "15m"});

      // Send verification email
      // path to join the template file with the path
      const templatePath = path.join(
        __dirname, 
        "../templates",
        "register-template.hbs"
      );
      const templateSource = fs.readFileSync(templatePath, "utf-8");
      
      // Handlebars.compile is a function that compiles the template and generates and read the HTML file
      const compiledTemplate = Handlebars.compile(templateSource);
      const html = compiledTemplate({
        email: param.email, 
        fe_url: "http://localhost:3000/activation?token="
      });

      // Send email after users register their account
      await Transporter.sendMail ({
        from: "EOHelper",
        to: param.email,
        subject: "Welcome",
        html
      });

      return user;
    }); 
  } catch (error) {
    throw new Error(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// function to activate user account
// This function takes a token as a parameter and returns a promise of type Users | null
async function ActivateUserService(token: string) {
  try {
    // Verify the JWT token
    const decoded = verify(token, String(SECRET_KEY)) as { email: string };
    
    // Update the user's verification status
    const updatedUser = await prisma.$transaction(async (t: any) => {
      return await t.users.update({
        where: {
          email: decoded.email,
          is_verified: false // Only update if currently not verified
        },
        data: {
          is_verified: true
        }
      });
    });

    if (!updatedUser) {
      throw new Error("User not found or already verified");
    }

    return updatedUser;
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
      email: users.email,
      first_name: users.first_name,
      last_name: users.last_name,
      roleName: users.role.name
    }

    // sign is used to create a JWT token with the user's informatio
    // The token is signed with a secret key and has an expiration time of 1 hour
    const token = sign(payload, String(SECRET_KEY), { expiresIn: "1h"});

    return {user: payload, token};
  } catch (err) {
    throw err;
  }
}

async function UpdateUserService(file: Express.Multer.File, email: string) {
  let url = "";
  try {
    const checkUser = await FindUserByEmail(email);

    if (!checkUser) throw new Error("User not found");

    await prisma.$transaction(async (t: any) => {
      const { secure_url } = await cloudinaryUpload(file);
      url = secure_url;
      const splitUrl = secure_url.split("/");
      // splitUrl.length - 1 to get the last part of the URL
      const fileName = splitUrl[splitUrl.length - 1];

      // where is used to find the user by email and update the profile_picture field with the fileName
      await t.users.update({
        where: {
          email: checkUser.email,
        },
        data: {
          profile_picture: fileName,
        },
      });
    });
  } catch (err) {
    await cloudinaryRemove(url);
    throw err;
  }
}

async function UpdateUserService2(file: Express.Multer.File, email: string) {
  try {
    const checkUser = await FindUserByEmail(email);

    if (!checkUser) throw new Error("User not found");

    await prisma.$transaction(async (t: any) => {
      await t.users.update({
        where: {
          email: checkUser.email,
        },
        data: {
          profile_picture: file.filename,
        },
      });
    });
  } catch (err) {
    throw err;
  }
}

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

// Exporting the functions to be used in controllers directory
export { 
  GetAll,
  RegisterService, 
  ActivateUserService,
  LoginService,
  UpdateUserService,
  UpdateUserService2,
  VerifyUserService
  };