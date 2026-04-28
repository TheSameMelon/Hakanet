from sqlmodel import SQLModel, Field

class Performance(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    region: str
    city: str
    competition_type: str
    competition: str
    age_category: str
    discipline : str