from .service import RefereeService
from fastapi import APIRouter
from core.types import APIResponce
router = APIRouter()
service = RefereeService()

@router.get("all")
def get_all():
    data = service.get_all()
    if not data:
        return APIResponce(status="error")
    return APIResponce(status="success", data=data)