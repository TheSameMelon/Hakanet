from pydantic import BaseModel
from typing import Optional

class AuthData(BaseModel):
    username: str
    password: str
