import { Users } from "@prisma/client";
import { IRegisterParam, ILoginParam } from "../interface/user.interface";
import prisma from "../lib/prisma";
import { hash, genSaltSync, compare } from "bcrypt";
import { sign } from "jsonwebtoken";

import { SECRET_KEY } from "../config";

async function GetAll() {
  try {
    return await prisma.user.findMany();
  } catch(err) {
    throw err;
  }
}

async function FindUserByEmail(email: string) {
  try {
    const user = await prisma.users.findFirst({
      select: {
        email: true,
        first_name: true,
        last_name: true,
        password: true,
        role: {
          select: {
            name: true,
          },
        },
      },
      where: {
        email,
      },
      // include: {
      //   role: true
      // }
    });
    // select * from user where email = email limit 1

    return user;
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

      let user = await t.user.create({
        data: {
          first_name: param.first_name,
          last_name: param.last_name,
          email: param.email,
          password: hashedPassword,
          isVerified: false,
          roleId: param.roleId,
        },
      });

      return user;
    });

    // insert into user(first_name, last_name, email, password, isverified) values(param.first_name, param.last_name, param.email, param.password, false)
  } catch (err) {
    throw err;
  }
}

async function LoginService(param: ILoginParam) {
  try {
    const user = await FindUserByEmail(param.email);

    if (!user) throw new Error("Email tidak terdaftar");

    const checkPass = await compare(param.password, user.password);

    if (!checkPass) throw new Error("Password Salah");

    const payload = {
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role.name
    }

    const token = sign(payload, String(SECRET_KEY), { expiresIn: "1h"});

    return {user: payload, token};
  } catch (err) {
    throw err;
  }
}

export { RegisterService, LoginService, GetAll };
