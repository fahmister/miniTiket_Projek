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

export interface IEventReqParam {
    id:          string,    
    name:        string,
    category:    string,
    image_url:   string?,
    location:    string,
    start_date:  Date,
    end_date:    Date,
    seats:       number
    organizer:   string
    price:       number
    description: string
    created_at:  Date 
  }
  
  declare global {
    // namespace purpose is to extend the Express Request object
    // to include the event property
    namespace Express {
      export interface Request {
        user?: IEventReqParam;
      }
    }
  }  

export interface ICouponParams  {
  userId: number;
  code?: string;
  discountPercentage?: number;
  validityMonths?: number;
  couponName?: string;
}

  declare global {
    // namespace purpose is to extend the Express Request object
    // to include the event property
    namespace Express {
      export interface Request {
        user?: ICouponParams;
      }
    }
  }  

