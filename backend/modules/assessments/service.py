from data.database import engine
from sqlmodel import Session, select,delete
from core.types import APIResponce, Assessment
import csv
import pathlib
import shutil
import io

class AssessmentService:
    def __init__(self):
        self.engine = engine
        self.path = pathlib.Path(__file__).parent.parent.parent / "data/archive/Basic/assessments.csv"
    
    def read(self, force=True):
        with Session(self.engine) as session:
            if force:
                session.exec(delete(Assessment))
                session.commit()
            test = session.exec(select(Assessment)).first()
            if test != None:
                print("ASSESSMENTS ALREADY FETCHED")
                return
        session.close()
        with open(self.path, encoding="utf-8-sig") as file:
            reader = csv.reader(file)
            arr = [Assessment(id=i[0], referee_id=i[1], performance_id=i[2],type=i[3] ,number=i[4], referee_assessment=i[5], result_type_assessment=i[6], result_assessment=i[7]) for i in reader]

        with Session(self.engine) as session:
            session.add_all(arr)
            session.commit()

    def change_path(self, archive: str):
        self.path = pathlib.Path(__file__).parent.parent.parent / f"data/archive/{archive}/assessments.csv"

    def perm_assessments(self, perm_id: int):
        try:
            with Session(self.engine) as session:
                data = session.exec(select(Assessment).where(Assessment.performance_id == perm_id)).all()
            return data

        except Exception as e:
            print(repr(e))
            return None
    
    def upload(self, file: bytes, archive: str):
        try:
            b = io.BytesIO(file)
            self.change_path(archive)
            text = io.TextIOWrapper(b, "utf-8-sig")
            print(self.path)
            with open(self.path, mode="w", encoding="utf-8-sig") as f:
               f.write(text.read())
        except Exception as e:
            print(repr(e))
            return
        print("ASSESSMENTS UPLOADED")
        self.read(force=True)
    
    
    def switch(self, archive: str):
        self.change_path(archive)
        self.read(force=True)