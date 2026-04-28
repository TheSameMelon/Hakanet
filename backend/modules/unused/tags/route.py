from fastapi import APIRouter
from .service import TagService
from core.types import APIResponce
from .types import IDRequest, TagRequest, ConnectionRequest

router = APIRouter()
service = TagService()

@router.get("/get")
def get_tags():
    tags = service.get_tags()
    if tags:
        return APIResponce(status="success", data=tags)
    return APIResponce(status="error")


@router.post("/create")
def create_tag(req: TagRequest):
    success = service.create_tag(req.tag)
    if success:
        return APIResponce(status="success")
    return APIResponce(status="error")


@router.post("/attach")
def attach_tag(req: ConnectionRequest):
    success = service.attach(req.entity_id, req.tag_id)
    if success:
        return APIResponce(status="success")
    return APIResponce(status="error")

@router.post("/detach")
def attach_tag(req: ConnectionRequest):
    success = service.detach(req.entity_id, req.tag_id)
    if success:
        return APIResponce(status="success")
    return APIResponce(status="error")


@router.post("/get_with")
def get_with_tag(req: TagRequest):
    entities = service.with_tag(req.tag)
    if entities:
        return APIResponce(status="success", data=entities)
    return APIResponce(status="error")


@router.post("/get_entity_tags")
def get_entity_tags(req: IDRequest):
    tags = service.get_entity_tags(req.id)
    return tags