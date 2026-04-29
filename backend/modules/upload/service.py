from modules.assessments.service import AssessmentService
from modules.performances.service import PerformanceService
from modules.referee.service import RefereeService
from modules.rating.service import DispersionService
from data.database import engine
from fastapi import UploadFile
from sqlmodel import Session, select
import csv
import io

class UploadService:
    def __init__(self):
        self.engine = engine
    
    def upload(self, ref: bytes, perf: bytes, assess: bytes):
        AssessmentService().upload(assess)
        PerformanceService().upload(perf)
        RefereeService().upload(ref)

        DispersionService().calc_rating()
