from sqlmodel import SQLModel, Field
from pydantic import BaseModel
from typing import Dict, Literal, Any, Optional, Sequence
from enum import Enum

class Roles(str, Enum):
    USER = "user"
    MENTOR = "mentor"
    


#class User(SQLModel, table=True):
#    id: int | None = Field(default=None, primary_key=True)
#    username: str = Field(unique=True)
#    role: Roles = Field(default="user")
#    password: str


#class Entity(SQLModel, table=True):
#    id: int | None = Field(default=None, primary_key=True)
#    entity_type: str # Любое название по типу: team, company, order и т.п
#    name: str
#    description: str | None = None
#   meta: Optional[str] = None


class APIResponce(BaseModel):
    status: Literal["success", "error"]
    error: Optional[Any] = ""
    data: Optional[Any] = {}