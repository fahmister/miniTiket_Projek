// This file contains the interface for user-related operations
// such as login and registration.
export interface IRegisterParam {
    email: string,
    password: string,
    first_name: string,
    last_name: string,
    roleId : string
}

export interface ILoginParam {
    email: string,
    password: string
}