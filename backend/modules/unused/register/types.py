from pydantic import BaseModel
from typing import Literal
from core.types import Roles

class RegisterData(BaseModel):
    username: str
    password: str
    role: Roles