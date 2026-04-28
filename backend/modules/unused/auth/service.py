from sqlmodel import Session, select
from passlib.hash import pbkdf2_sha256
from core.types import User
from data.database import engine
from .types import AuthData
from jwt import PyJWT
from uuid import uuid4
from datetime import datetime, timedelta
from core.settings import settings

class AuthService:
    def __init__(self) -> None:
        self.engine = engine
        self.jwt = PyJWT()
    
    def find_user(self, data: AuthData):
        with Session(self.engine) as session:
            statement = select(User).where(User.username == data.username) 
            user = session.exec(statement).one()
            if pbkdf2_sha256.verify(data.password, user.password):
                return user
            else:
                raise Exception("No users were found")
    
    def generate_jwt(self, user: User):
        timestamp = datetime.utcnow() + timedelta(hours=48)
        time = datetime.utcnow()
        payload = {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "iat": time,
            "exp": timestamp,
            "jti": str(uuid4())
        }
        jwt = self.jwt.encode(payload, settings.JWTKEY)
        print(jwt)
        return jwt

    def auth_request(self, data: AuthData):
        user = self.find_user(data)
        jwt = self.generate_jwt(user)
        return jwt
    
    def decode_jwt(self, jwt: str):
        decoded = self.jwt.decode(jwt, settings.JWTKEY, "HS256")
        return decoded
