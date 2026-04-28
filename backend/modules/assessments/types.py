from sqlmodel import SQLModel, Field
from enum import Enum

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