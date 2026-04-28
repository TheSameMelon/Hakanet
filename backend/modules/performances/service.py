from core.types import Performance, Rating, Referee, Assessment
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
    
    def get_all_referees(self, ref_id: int):
        try:
            with Session(self.engine) as session:
                st = select(Performance, Assessment.referee_assessment, Assessment.result_type_assessment, Assessment.type).join(Assessment, Assessment.performance_id==Performance.id).where(Assessment.referee_id == ref_id)
                data = session.exec(st).all()
                perf = []
                for row in data:
                    p = row[0]  # Referee объект
                    mark = row[1]
                    diff = row[1] - row[2]
                    type = row[3]
                    
                    perf.append(
                        {
                            "id": p.id,
                            "region": p.region,
                            "city": p.city,
                            "competition": p.competition,
                            "age_category": p.age_category,
                            "discipline": p.discipline,
                            "diff": diff,
                            "mark": mark,
                            "type": type
                        }
                    )
                return perf
        except Exception as e:
            print(repr(e))
            return None