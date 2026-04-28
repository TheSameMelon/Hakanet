from sqlmodel import Session, select
from data.database import engine
from .types import Profile

class ProfileService:
    def __init__(self):
        self.engine = engine
    
    def get_profile(self, user_id: int):
        try:
            with Session(self.engine) as session:
                stat = select(Profile).where(Profile.id == user_id)
                profile = session.exec(stat).one()
            
            return profile
        except Exception as e:
            print(repr(e))
            return None
    
