from sqlmodel import SQLModel, Field
from pydantic import BaseModel
from typing import Dict, Literal, Any, Optional, Sequence
from enum import Enum

class Roles(str, Enum):
    USER = "user"
    MENTOR = "mentor"
    
class Referee(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    fio: str
    region: str
    city: str

class Performance(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    region: str
    city: str
    competition_type: str
    competition: str
    age_category: str
    discipline : str


class Types(str, Enum):
    ARTISTIC = "ARTISTIC"
    EXECUTION = "EXECUTION"

class Assessment(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    refery_id: int# = Field(foreign_key="refery.id")
    performance_id: int# = Field(foreign_key="performance.id")
    type: Types = Field() # Тип оценки (ARTISTIC или EXECUTION)
    number: int # Порядковый номер оценки в бригаде(для сортировки)
    referee_assessment: int # Оценка, поставленная судьей
    result_type_assessment: int # Итоговая оценка по категории
    result_assessment: int # Общая оценка за выступление

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