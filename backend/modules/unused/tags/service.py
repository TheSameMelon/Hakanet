from data.database import engine
from core.types import Entity
from .types import Tag, Tag_Entity
from sqlmodel import select, Session

class TagService:
    def __init__(self):
        self.engine = engine
    
    def create_tag(self, param: str):
        try:
            with Session(self.engine) as session:
                tag = Tag(tag=param)
                session.add(tag)
                session.commit()
            return True
        except Exception as e:
            print(repr(e))
            return False
    
    def get_tags(self):
        try:
            with Session(self.engine) as session:
                statement = select(Tag)
                data = session.exec(statement).all()
            return data
        except Exception as e:
            print(repr(e))
            return None

    def attach(self, entity_id: int, tag_id: int) -> bool:
        try:
            with Session(self.engine) as session:
                relation = Tag_Entity(entity_id=entity_id, tag_id=tag_id)
                session.add(relation)
                session.commit()
            return True
        except:
            return False


        
    def with_tag(self, tag: str):
        try:
            with Session(self.engine) as session:
                statement = (select(Entity)
                .join(Tag_Entity, Tag_Entity.entity_id == Entity.id) # Тут всё нормально, не трогай # type: ignore
                .join(Tag, Tag.id == Tag_Entity.tag_id) # Приколыши с типизацией # type: ignore
                .where(Tag.tag == tag))
                entities = session.exec(statement).all()

            return entities  
        except Exception as e:
            print(repr(e))
            return None
    
    def detach(self, entity_id: int, tag_id: int):
        try:
            with Session(self.engine) as session:
                stat = select(Tag_Entity).where(Tag_Entity.entity_id == entity_id and Tag_Entity.tag_id == tag_id)
                connection = session.exec(stat).one()
                session.delete(connection)
                session.commit()
            return True
        except Exception as e:
            print(repr(e))
            return False

    def get_entity_tags(self, entity_id: int):
        try:
            with Session(self.engine) as session:
                stat = select(Tag).join(Tag_Entity, Tag.id == Tag_Entity.tag_id).join(Entity, Entity.id == Tag_Entity.entity_id).where(Entity.id == entity_id) # type: ignore # и тут не трогай
                tags = session.exec(stat).all()
            return tags
        except Exception as e:
            return None

    