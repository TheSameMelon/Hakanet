import request from "../../core/api";
import { APIResponce } from "../../core/types";
import { useState, useEffect } from "react";
import RegisterData from "./types";

const validate = (data: RegisterData) => {
    if (data.username !== "" && data.password !== ""){
        return true
    }
    return false
}

function useRegister(): [boolean, (data: RegisterData) => Promise<APIResponce>]{
    const [loading, setLoading] = useState<boolean>(false);
    const register = async(data: RegisterData): Promise<APIResponce> => {
        if (!validate(data)){
            return Promise.resolve({status: "error", error: "VALIDATION ERROR"})
        }
        setLoading(true);
        const res = request("/register/", "post", data);
        setLoading(false);
        return res;
    }
    return [loading, register];
}



export default useRegister;