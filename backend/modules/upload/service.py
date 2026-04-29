from modules.assessments.service import AssessmentService
from modules.performances.service import PerformanceService
from modules.referee.service import RefereeService
from modules.rating.service import DispersionService
from data.database import engine
from fastapi import UploadFile
from sqlmodel import Session, select
from datetime import datetime
import pathlib
import csv
import io
import send2trash

class UploadService:
    def __init__(self):
        self.engine = engine
    
    def upload(self, ref: bytes, perf: bytes, assess: bytes):
        arcive = str(datetime.now().time()).replace(":", "").replace(".","")
        path = pathlib.Path(__file__).parent.parent.parent / f"data/archive/{arcive}"
        path.mkdir()
        AssessmentService().upload(assess, arcive)
        PerformanceService().upload(perf, arcive)
        RefereeService().upload(ref, arcive)


        DispersionService().calc_rating()

        return arcive

    def switch(self, arcive: str):
        AssessmentService().switch(arcive)
        PerformanceService().switch(arcive)
        RefereeService().switch(arcive)
    
        DispersionService().calc_rating()

        return arcive

    def get_archive(self):
        path = pathlib.Path(__file__).parent.parent.parent / "data/archive"
        dirs = [f.name for f in path.iterdir() if f.is_dir()]
        return dirs

    def delete(self, archive: str):
        path = pathlib.Path(__file__).parent.parent.parent / f"data/archive/{archive}"
        send2trash.send2trash(path)
        return True