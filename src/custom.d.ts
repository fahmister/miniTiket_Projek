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
    namespace Express {
      export interface Request {
        user?: IEventReqParam;
      }
    }
  }  