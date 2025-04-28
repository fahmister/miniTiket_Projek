// This file contains the interface for user-related operations
// such as login and registration.
export interface IRegisterParam {
    email: string,
    password: string,
    first_name: string,
    last_name: string,
    roleId : number,
    referral_code: string | undefined,
    referredByUserId?: string
}

export interface ILoginParam {
    email: string,
    password: string
}

export interface IUpdateUser{
    file: Express.Multer.File,
    email: string
}