import { Users } from "@prisma/client";
import { IRegisterParam, ILoginParam } from "../interface/user.interface";
import prisma from "../lib/prisma";
import { hash, genSaltSync, compare } from "bcrypt";
import { sign } from "jsonwebtoken";

import { SECRET_KEY } from "../config";

async function GetAll() {
  try {
    return await prisma.users.findMany();
  } catch(err) {
    throw err;
  }
}

async function FindUserByEmail(email: string) {
  try {
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
      // include: {
      //   role: true
      // }
    });
    // select * from user where email = email limit 1

    return users;
  } catch (err) {
    throw err;
  }
}

async function RegisterService(param: IRegisterParam) {
  try {
    // validasi ketika email sudah terdaftar
    const isExist = await FindUserByEmail(param.email);

    if (isExist) throw new Error("Email sudah terdaftar");

    await prisma.$transaction(async (t) => {
      const salt = genSaltSync(10);
      const hashedPassword = await hash(param.password, salt);

      let Users = await t.users.create({
        data: {
          first_name: param.first_name,
          last_name: param.last_name,
          email: param.email,
          password: hashedPassword,
          is_Verified: false,
          roleId: param.roleId,
          user_points: 0, // Default value for user_points
          expiry_points: new Date(), // Default value for expiry_points
        },
      });

      return Users;
    });

    // insert into user(first_name, last_name, email, password, isverified) values(param.first_name, param.last_name, param.email, param.password, false)
  } catch (err) {
    throw err;
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

export { RegisterService, LoginService, GetAll };
