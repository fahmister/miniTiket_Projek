import { IRegisterParam, ILoginParam,  } from "../interface/user.interface";
import prisma from "../lib/prisma";
import { hash, genSaltSync, compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { cloudinaryUpload, cloudinaryRemove } from "../utils/cloudinary";
import { Transporter } from "../utils/nodemailer";

// Handlebars template engine
import Handlebars from "handlebars";
// path to join path with the file name
import path from "path";
// fs to read and manipulate files
import fs from "fs";

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

    // hash the password using bcrypt (hash, getSaltSync)
    await prisma.$transaction(async (t: any) => {
      const salt = genSaltSync(10);
      const hashedPassword = await hash(param.password, salt);
      
      // insert into user table in prisma database
      // (first_name, last_name, email, password, isverified) 
      // values(param.first_name, param.last_name, param.email, param.password, false)
      
      await prisma.role.createMany({
        data: [
          { id: 1, name: 'Customer' },
          { id: 2, name: 'Event' }
        ],
        skipDuplicates: true
      });

    // Check if referral code exists if provided
    // User can provide a referral code when account registering or leave it empty
    let referredByUserId: string | undefined;
    
    if (param.referral_code) {
      const referringUser = await prisma.users.findUnique({
        where: { referral_code: param.referral_code }
      });
      
      if (!referringUser) {
        throw new Error('Invalid referral code');
      }
      referredByUserId = referringUser.id.toString();
    }

    return await prisma.$transaction(async (tx) => {
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
          referred_by: param.referredByUserId || null,
        },
      });
      // lines 93-104 insert into user table in prisma database
      
      // 2. Generate a proper referral code and update
      const finalReferralCode = `TIX-${user.id.toString().padStart(6, '0')}`;
      await tx.users.update({
        where: { id: user.id },
        data: { referral_code: finalReferralCode },
      });

      // path to join the template file with the path
      const templatePath = path.join(
        __dirname, 
        "../templates",
        "register-template.hbs"
      );

      const templateSource = fs.readFileSync(templatePath, "utf-8");
      // Handlebars.compile is a function that compiles the template and generates and read the HTML file
      const compiledTemplate = Handlebars.compile(templateSource);
      const html = compiledTemplate({email: param.email})

      // Send email after user register its account
      await Transporter.sendMail ({
        from: "EOHelper",
        to: param.email,
        subject: "Welcome",
        html
      });

      return user;
    }); // Closing parenthesis for prisma.$transaction
    }); // Add missing parenthesis for outer prisma.$transaction
  } catch (error) {
    throw new Error(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    await prisma.$transaction(async (t) => {
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

    await prisma.$transaction(async (t) => {
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
    await prisma.$transaction(async (t) => {
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
  RegisterService, 
  LoginService, 
  GetAll,
  UpdateUserService,
  UpdateUserService2,
  VerifyUserService
  };