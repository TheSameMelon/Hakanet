from fastapi import APIRouter
from core.types import APIResponce
from .service import PerformanceService

service = PerformanceService()
router = APIRouter()

@router.get("all")
def get_all():
    data = service.get_all()
    if not data:
        return APIResponce(status="error")
    return APIResponce(status="success", data=data)