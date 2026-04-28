from core.types import Referee, Performance, Assessment
from sqlmodel import Session, select
from data.database import engine

class DispersionService:
    def __init__(self):
        self.engine = engine
