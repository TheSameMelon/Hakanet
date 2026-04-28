from fastapi import APIRouter, Depends, Request
from core.types import APIResponce
from .types import IDRequest
from typing import Dict, Any
from core.security import verify_user
from .service import ProfileService

router = APIRouter()
service = ProfileService()

@router.get("/me")
def self_profile(req: Request, user: Dict[str, Any] = Depends(verify_user)):
    user_id = user["id"]
    profile = service.get_profile(user_id)
    if profile:
        return APIResponce(status="success", data=profile)
    return APIResponce(status="error", error="CAN NOT GET PROFILE")
