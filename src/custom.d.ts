export interface IUserReqParam {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    roleName: string;
  }
  
  declare global {
    namespace Express {
      export interface Request {
        user?: IUserReqParam;
      }
    }
  }  

  export interface ICouponParams {
    userId: number;
    code?: string;
    discountPercentage?: number;
    validityMonths?: number;
    couponName?: string;
  }
  declare global {
    namespace Express {
      export interface Request {
        user?: ICouponParams;
      }
    }
  }  

import { Request } from "express";
declare module "express-serve-static-core" {
  interface Request {
    id?: number; // Add 'id' as an optional property
  }
}