import { IRegisterParam, ILoginParam,  } from "../interface/user.interface";
import prisma from "../lib/prisma";
import { hash, genSaltSync, compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { createReferralCode  } from '../services/referral.service';

import { SECRET_KEY } from "../config";


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
      select: {
        email: true,
        first_name: true,
        last_name: true,
        password: true,
        roleId: true,
      },
      where: {
        email,
      },
      // lines 23 & 31-33 same as this query: select * from user where email = email limit 1
      // include: {
      //   role: true
      // }
    });

    return users;
  } catch (err) {
    throw err;
  }
}

// Function to register a new user
// This async function takes a parameter of type IRegisterParam and returns a promise of type Users

// Define a default role ID
const defaultRoleId = 2; // Replace 1 with the actual default role ID from your database

async function RegisterService(param: IRegisterParam) {
  try {
    // validate email aleady registered
    // select * from user where email = email limit 1
    const isExist = await FindUserByEmail(param.email);
    
    if (isExist) throw new Error("Email is already registered");

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
          roleId: defaultRoleId, // Default role ID
          user_points: 0, // Default value for user_points
          expiry_points: new Date(new Date().setMonth(new Date().getMonth() + 3)), // 3 months expiry
          referral_code: param.referral_code || ''
        },
      });
      
      // 2. Generate a proper referral code and update
      const finalReferralCode = `TIX-${user.id.toString().padStart(6, '0')}`;
      await tx.users.update({
        where: { id: user.id },
        data: { referral_code: finalReferralCode },
      });

      return user;
    }); // Closing parenthesis for prisma.$transaction
    }); // Add missing parenthesis for outer prisma.$transaction
  } catch (error) {
    console.error('Registration failed:', error);
    throw new Error(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}


async function LoginService(param: ILoginParam) {
  try {
    const users = await FindUserByEmail(param.email);

    if (!users) throw new Error("Email tidak terdaftar");

    const checkPass = await compare(param.password, users.password);

    if (!checkPass) throw new Error("Password Salah");

    const payload = {
      email: users.email,
      first_name: users.first_name,
      last_name: users.last_name,
      roleID: users.roleId
    }

    const token = sign(payload, String(SECRET_KEY), { expiresIn: "1h"});

    return {user: payload, token};
  } catch (err) {
    throw err;
  }
}

// Exporting the functions to be used in controllers directory
export { RegisterService, LoginService, GetAll };