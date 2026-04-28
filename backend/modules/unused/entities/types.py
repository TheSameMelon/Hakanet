from pydantic import BaseModel
from typing import Optional

class IDRequest(BaseModel):
    id: int

class GetTypeRequest(BaseModel):
    type: str

