from data.database import engine
from sqlmodel import Session, select
from core.types import APIResponce, Assessment
import csv
import pathlib

class AssessmentService:
    def __init__(self):
        self.engine = engine
        self.path = pathlib.Path(__file__).parent.parent.parent / "data/assessments.csv"
    
    def read(self):
        with Session(self.engine) as session:
            test = session.exec(select(Assessment)).first()
            if test != None:
                print("ASSESSMENTS ALREADY FETCHED")
                return
            session.close()
        with open(self.path) as file:
            reader = csv.reader(file)
            arr = [Assessment(id=i[0], referee_id=i[1], performance_id=i[2],type=i[3] ,number=i[4], referee_assessment=i[5], result_type_assessment=i[6], result_assessment=i[7]) for i in reader]

        with Session(self.engine) as session:
            session.add_all(arr)
            session.commit()

    def perm_assessments(self, perm_id: int):
        try:
            with Session(self.engine) as session:
                data = session.exec(select(Assessment).where(Assessment.performance_id == perm_id)).all()
            return data

        except Exception as e:
            print(repr(e))
            return None
    
