from fastapi import APIRouter
from core.types import APIResponce, Entity
from .service import EntityService
from json import loads
from .types import IDRequest, GetTypeRequest

router = APIRouter()
service = EntityService()

@router.post("/create")
def create_entity(data: Entity):
    success = service.create_entity(data)
    if success:
        return APIResponce(status="success")
    return APIResponce(status="error")


@router.post("/find")
def find_entity(data: IDRequest):
    entity = service.find_entity(data.id)
    if entity:
        json = loads(entity.model_dump_json())
        return APIResponce(status="success", data=json)
    return APIResponce(status="error")


@router.post("/with_type")
def get_type(req: GetTypeRequest):
    entities = service.get_type(req.type)
    if entities:
        return APIResponce(status="success", data=entities)
    return APIResponce(status="error")


@router.post("/drop")
def drop(req: IDRequest):
    success = service.drop_entity(req.id)
    if success:
        return APIResponce(status="success")
    return APIResponce(status="error")


