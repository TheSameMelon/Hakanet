from sqlmodel import SQLModel, Field

"""
      "total": 139,
      "bullseye": 17,
      "acceptable": 112,
      "serious": 10,
      "deviation_sum": 6.974999999999998,
      "bias_own_sum": 0,
      "bias_own_count": 0,
      "bias_other_sum": 6.974999999999998,
      "bias_other_count": 139,
      "accuracy_rate": 0.9280575539568345,
      "bullseye_rate": 0.1223021582733813,
      "avg_deviation": 0.0501798561151079,
      "bias": 0.0501798561151079,
      "bias_interpretation": "Завышает чужим на 0.05"
"""

class Rating(SQLModel, table=True):
    id: int | None = Field(primary_key=True, default=None)
    referee_id: int #= Field(foreign_key="referee.id")
    execution: str # JSON STR
    artistic: str # JSON STR