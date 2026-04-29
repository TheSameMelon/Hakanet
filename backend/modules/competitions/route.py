from fastapi import APIRouter
from .service import CompetitionService
from core.types import APIResponce

router = APIRouter()
service = CompetitionService()

@router.get("/all")
def get_all():
    data = service.all()
    if not data:
        return APIResponce(status="error")
    return APIResponce(status="success", data=data)