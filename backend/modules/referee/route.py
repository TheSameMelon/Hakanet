from .service import RefereeService
from fastapi import APIRouter
from core.types import APIResponce
router = APIRouter()
service = RefereeService()

@router.get("/all")
def get_all():
    data = service.get_all()
    if not data:
        return APIResponce(status="error")
    return APIResponce(status="success", data=data)

@router.get("/profile/{id}")
def get_progile(id: int):
    data = service.get_profile(id)
    if not data:
        return APIResponce(status="error")
    return APIResponce(status="success", data=data)