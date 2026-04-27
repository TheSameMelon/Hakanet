type SuccessResponce = {
    status: "success",
    data: unknown
}

type ErrorResponce = {
    status: "error",
    error: string
}

export type User = {
    id: number,
    username: string,
    role: Roles
}

export type Entity = {
    id?: number,
    entity_type: string,
    name: string,
    description: string,
    meta: string // JSON string
}

export enum Roles {
    USER = "user",
    MENTOR = "mentor"
}

export type Tag = {
    id: number,
    tag: string
}

export type APIResponce = SuccessResponce | ErrorResponce;