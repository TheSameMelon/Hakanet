import request from "@/core/api";
import { APIResponce, Entity } from "@/core/types";
import { EntityFuncs } from "./types";

const validate = (req: Entity): boolean => {
    if (req.name !== "" && req.entity_type !== ""){
        return true;
    }
    return false;
}

const useEntity = (): EntityFuncs => {
    const create = async(req: Entity): Promise<APIResponce> => {
        if (!validate(req)) return Promise.resolve({status: "error", error: "VALIDATION ERROR"})
        const res = request(`/entity/create`, "post", req);
        return res;
    }

    const find = async(id: number): Promise<APIResponce> => {
        const res = request("/entity/find", "post", { id });
        return res;
    }

    const with_type = async(type: string): Promise<APIResponce> => {
        const res = request("/entity/with_type", "post", { type });
        return res;
    }

    const drop = async(id: number): Promise<APIResponce> => {
        const res = request("/entity/drop", "post", { id });
        return res;
    }

    return {create, find, with_type, drop}
    
}
export default useEntity;