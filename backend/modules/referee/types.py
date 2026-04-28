from sqlmodel import SQLModel, Field

class Referee(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    fio: str
    region: str
    city: str
