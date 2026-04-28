from core.types import APIResponce
from fastapi import APIRouter
from .service import DispersionService

router = APIRouter()
service = DispersionService()

@router.get("/profile/{referee_id}")
def get_rating(referee_id: int):
    data = service.get_referee_stats(referee_id)
    if not data:
        return APIResponce(status="error")
    return APIResponce(status="success", data=data)