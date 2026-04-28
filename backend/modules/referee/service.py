from sqlmodel import Session, select
from core.types import Referee
from data.database import engine
import pathlib
import csv

class RefereeService:
    def __init__(self):
        self.engine = engine
        self.path = pathlib.Path(__file__).parent.parent.parent / "data/referee.csv"
    
    def read(self):
        with Session(self.engine) as session:
            test = session.exec(select(Referee)).first()
            if test != None:
                print("REFEREES ALREADY FETCHED")
                return
            session.close()
        with open(self.path, encoding="utf-8") as file:
            reader = csv.reader(file)
            arr = [Referee(id=i[0], fio=i[1], region=i[2], city=i[3]) for i in reader]

        with Session(self.engine) as session:
            session.add_all(arr)
            session.commit()

    def get_all(self):
        try:
            with Session(self.engine) as session:
                data = session.exec(select(Referee)).all()
            return data
        except Exception as e:
            print(repr(e))
            return None