export interface IRegisterParam {
    email: string,
    password: string,
    first_name: string,
    last_name: string
    roleId : number
}

export interface ILoginParam {
    email: string,
    password: string
}