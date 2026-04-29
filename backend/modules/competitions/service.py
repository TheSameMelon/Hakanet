from data.database import engine
from sqlmodel import Session, select
from core.types import Rating, Assessment, Referee, Performance
from typing import Dict
from modules.rating.service import DispersionService

class CompetitionService:
    def __init__(self):
        self.engine = engine
        self.rating = DispersionService()
    
    def all(self):
        return self.rating.get_competition_stats()