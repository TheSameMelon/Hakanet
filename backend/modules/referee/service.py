import shutil

from sqlmodel import Session, select, delete
from core.types import Referee, Rating
from data.database import engine
import pathlib
import csv
import io

class RefereeService:
    def __init__(self):
        self.engine = engine
        self.path = pathlib.Path(__file__).parent.parent.parent / "data/archive/Basic/referee.csv"
    
    def read(self, force=False):
        with Session(self.engine) as session:
            if force:
                session.exec(delete(Referee))
                session.commit()
            
            test = session.exec(select(Referee)).first()
            if test != None:
                print("REFEREE ALREADY FETCHED")
                return
        session.close()
        with open(self.path, encoding="utf-8-sig") as file:
            reader = csv.reader(file)
            arr = [Referee(id=i[0], fio=i[1], region=i[2], city=i[3]) for i in reader]

        with Session(self.engine) as session:
            session.add_all(arr)
            session.commit()

    def change_path(self, archive: str):
        self.path = pathlib.Path(__file__).parent.parent.parent / f"data/archive/{archive}/referee.csv"

    def get_all(self):
        with Session(self.engine) as session:
            stmt = select(Referee, Rating.rating).join(
                Rating, Rating.referee_id == Referee.id
            )
            results = session.exec(stmt).all()
            
            # Преобразуем Row в словари
            referees = []
            for row in results:
                referee = row[0]  # Referee объект
                rating = row[1]   # rating значение
                
                referees.append({
                    'id': referee.id,
                    'fio': referee.fio,
                    'region': referee.region,
                    'city': referee.city,
                    'rating': rating
                })
            
            return referees
        
    def get_profile(self, referee_id: int):
        try:
            with Session(self.engine) as session:
                data = session.exec(select(Referee).where(Referee.id == referee_id)).one()
            return data
        except Exception as e:
            print(repr(e))
            return None
        
    def upload(self, file: bytes, archive: str):
        try:
            b = io.BytesIO(file)
            self.change_path(archive)
            text = io.TextIOWrapper(b, "utf-8-sig")
            with open(self.path, mode="w", encoding="utf-8-sig") as f:
                shutil.copyfileobj(text, f)
        except Exception as e:
            print(repr(e))
            return
        print("REFEREE UPLOADED")
        self.read(force=True)

    def switch(self, archive: str):
        self.change_path(archive)
        self.read(force=True)