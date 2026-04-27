import request from "@/core/api";
import {Tag, TagFunctions, Tag_Entity} from "./types"
import { APIResponce } from "@/core/types";


const useTags = (): TagFunctions => {
    
    const create = async(tag: string): Promise<APIResponce> => {
        if (!tag) return Promise.resolve({status: "error", "error": "VALIDATION ERROR"})
        const res = await request("/tag/create", "post", {tag});
        return res;
    }

    const attach = async(entity_id: number, tag_id: number): Promise<APIResponce> => {
        if (!entity_id || !tag_id) return Promise.resolve({status: "error", "error": "VALIDATION ERROR"})
        const res = await request("/tag/attach", "post", {entity_id, tag_id});
        return res;
    }

    const detach = async(entity_id: number, tag_id: number): Promise<APIResponce> => {
        if (!entity_id || !tag_id) return Promise.resolve({status: "error", "error": "VALIDATION ERROR"})
        const res = await request("/tag/detach", "post", {entity_id, tag_id});
        return res;
    }

    const get_with = async(tag: string): Promise<APIResponce> => {
        if (!tag) return Promise.resolve({status: "error", "error": "VALIDATION ERROR"})
        const res = await request("/tag/get_with", "post", {tag});
        return res;
    }

    const get_entity_tags = async(id: number): Promise<APIResponce> => {
        if (id === undefined) return Promise.resolve({status: "error", "error": "VALIDATION ERROR"})
        const res = await request("/tag/get_entity_tags", "post", {id});
        return res;
    }
    return {create, attach, detach, get_entity_tags, get_with}
}

export default useTags;