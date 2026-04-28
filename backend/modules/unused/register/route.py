from fastapi import APIRouter
from .types import RegisterData
from core.types import User, APIResponce
from .service import RegisterService
from sqlite3 import IntegrityError
from core.settings import settings

router = APIRouter()
service = RegisterService()


@router.post("/")
def register(data: RegisterData):
    try:
        user = service.to_user(data)
        resData = service.create_user(user)
        responce: APIResponce = APIResponce(status="success", data=resData)
        return responce
    except Exception as e:
        responce: APIResponce = APIResponce(status="error", error="DB EXCEPTION: REGISTER")
        print(repr(e))
        return responce
