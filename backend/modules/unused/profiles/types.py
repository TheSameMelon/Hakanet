from sqlmodel import SQLModel, Field
from pydantic import BaseModel
from typing import Optional

class Profile(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    username: str
    desc: Optional[str]

class IDRequest(BaseModel):
    id: int