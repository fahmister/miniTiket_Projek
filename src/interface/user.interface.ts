// This file contains the interface for user-related operations
// such as login and registration.
export interface IRegisterParam {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  referral_code?: string;
  roleId?: number;
  id?: string;
  referred_by: string // Add this property to fix the issue
}

export interface ILoginParam {
    email: string,
    password: string
}

export interface IUpdateUser{
    file: Express.Multer.File,
    email: string
}

export interface IAuthService {
  changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
}

export interface IPasswordService {
  comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;
  generateResetToken(userId: number): Promise<string>;
  verifyResetToken(token: string): Promise<{ userId: number }>;
}

export interface IEmailService {
  sendPasswordResetEmail(email: string, token: string): Promise<void>;
}

export interface IAuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}