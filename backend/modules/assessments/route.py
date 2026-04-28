from .service import AssessmentService
from fastapi import APIRouter
from core.types import APIResponce

router = APIRouter()
service = AssessmentService()


@router.get("/performance/{perm_id}")
def assessments(perm_id: int):
    data = service.perm_assessments(perm_id)
    if data:
        return APIResponce(status="success", data=data)
    return APIResponce(status="error")