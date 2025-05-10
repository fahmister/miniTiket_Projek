import { compare, hash } from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import { SECRET_KEY } from '../config';
import prisma from '../lib/prisma';
import { IPasswordService } from '../interface/user.interface';

export class PasswordService implements IPasswordService {
    async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
      return compare(plainPassword, hashedPassword);
    }
  
    async hashPassword(password: string): Promise<string> {
      const saltRounds = 10;
      return hash(password, saltRounds);
    }
  
    async generateResetToken(userId: number): Promise<string> {
      const resetToken = sign(
        { userId,
          type: 'password_reset'  // Add this to distinguish from other tokens
         },
        SECRET_KEY || 'default_secret_key',
        { expiresIn: '1h' }
      );
  
      await prisma.passwordResetToken.create({
        data: {
          userId,
          token: resetToken,
          expiresAt: new Date(Date.now() + 3600000) // 1 hour from now
        }
      });
  
      return resetToken;
    }
  
    async verifyResetToken(token: string): Promise<{ userId: number }> {
      if (!SECRET_KEY) {
        throw new Error('SECRET_KEY is not defined');
      }

      const decoded = verify(token, SECRET_KEY) as unknown as { 
        userId: number 
        type: string // Add this to ensure the token is for password reset
      };
  
      const resetToken = await prisma.passwordResetToken.findFirst({
        where: {
          userId: decoded.userId,
          token,
          expiresAt: { gt: new Date() }
        }
      });
  
      if (!resetToken) {
        throw new Error('Invalid or expired token');
      }
  
      return { userId: decoded.userId };
    }
  }