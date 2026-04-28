from data.database import engine
from sqlmodel import Session, select
from core.types import User, Entity
from modules.tags.types import Tag_Entity, Tag
import jwt

def get_users():
    try:
        with Session(engine) as session:
            data = session.exec(select(User)).all()
        
        return data
    except Exception as e:
        return repr(e)


def list_entities():
    try:
        with Session(engine) as session:
            data = session.exec(select(Entity)).all()
        
        return data
    except Exception as e:
        return repr(e)


def list_connections():
    try:
        with Session(engine) as session:
            data = session.exec(select(Tag_Entity)).all()
        
        return data
    except Exception as e:
        return repr(e)
    
def list_tags():
    try:
        with Session(engine) as session:
            data = session.exec(select(Tag)).all()
        
        return data
    except Exception as e:
        return repr(e)
