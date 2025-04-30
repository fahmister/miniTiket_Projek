// This file contains the interface for user-related operations
// such as login and registration.
export interface IRegisterParam {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  referral_code?: string;
  referred_by?: string;
  roleId?: number;
  id?: string; // Add this property to fix the issue
}

export interface ILoginParam {
    email: string,
    password: string
}

export interface IUpdateUser{
    file: Express.Multer.File,
    email: string
}