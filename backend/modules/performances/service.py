from core.types import Performance
from sqlmodel import Session, select
import pathlib
import csv
from data.database import engine

class PerformanceService:
    def __init__(self):
        self.engine = engine
        self.path = pathlib.Path(__file__).parent.parent.parent / "data/performances.csv"
    
    def read(self):
        with Session(self.engine) as session:
            test = session.exec(select(Performance)).first()
            if test != None:
                print("PERFORMANCED ALREADY FETCHED")
                return
            session.close()
        with open(self.path, encoding="utf-8") as file:
            reader = csv.reader(file)
            arr = [Performance(id=i[0], region=i[1], city=i[2], competition_type=i[3], competition=i[4], age_category=i[5], discipline=i[6]) for i in reader]
        with Session(self.engine) as session:
            session.add_all(arr)
            session.commit()

    def get_all(self):
        try:
            with Session(self.engine) as session:
                data = session.exec(select(Performance)).all()
            return data
        except Exception as e:
            print(repr(e))
            return None