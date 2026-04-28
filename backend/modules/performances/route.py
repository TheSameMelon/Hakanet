from fastapi import APIRouter
from core.types import APIResponce
from .service import PerformanceService

service = PerformanceService()
router = APIRouter()

@router.get("/all")
def get_all():
    data = service.get_all()
    if not data:
        return APIResponce(status="error")
    return APIResponce(status="success", data=data)

@router.get("/referee/{ref_id}")
def get_referees(ref_id: int):
    data = service.get_all_referees(ref_id)
    if not data:
        return APIResponce(status="error")
    return APIResponce(status="success", data=data)