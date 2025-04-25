export interface IUserReqParam {
    id: number; // Add the 'id' property to match the expected type
    email: string;
    first_name: string;
    last_name: string;
    roleId : number
    referral_code: string; // Add the referral_code property
  }
  
  declare global {
    namespace Express {
      export interface Request {
        user?: IUserReqParam;
      }
    }
  }  