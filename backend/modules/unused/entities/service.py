from core.types import Entity
from data.database import engine
from sqlmodel import Session, select, delete

class EntityService:
    def __init__(self):
        self.engine = engine
    
    def create_entity(self, data: Entity):
        try:
            with Session(self.engine) as session:
                session.add(data)
                session.commit()
            return True
        except Exception as e:
            print(repr(e))
            return False
    
    def find_entity(self, id: int):
        try:
            with Session(self.engine) as session:
                statement = select(Entity).where(Entity.id == id)
                data = session.exec(statement).one()
                return data
        except:
            return None
    
    def get_type(self, type: str):
        try:
            with Session(self.engine) as session:
                statement = select(Entity).where(Entity.entity_type == type)
                data = session.exec(statement).all()
                return data
        except:
            return None
        
    def drop_entity(self, id: int):
        try:
            with Session(self.engine) as session:
                statement = delete(Entity).where(Entity.id == id) # type: ignore OK
                entity = session.exec(statement)
                session.commit()
                print(entity.rowcount)
                if (entity.rowcount > 0): return True
                return False
        except:
            return None
    
    