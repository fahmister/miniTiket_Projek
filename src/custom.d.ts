export interface IUserReqParam {
    id: number; // Add the 'id' property to match the expected type
    email: string;
    first_name: string;
    last_name: string;
    roleName: string;
  }
  
  declare global {
    // namespace purpose is to extend the Express Request object
    // to include the user property
    namespace Express {
      export interface Request {
        user?: IUserReqParam;
      }
    }
  }  