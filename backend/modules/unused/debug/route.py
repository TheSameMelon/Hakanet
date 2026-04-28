from fastapi import APIRouter, HTTPException, Depends
from core.security import verify_user
from .service import get_users, list_connections, list_entities, list_tags

router = APIRouter()

@router.get("/get_users")
def users():
    return get_users()

@router.get("/protected")
def protected(user = Depends(verify_user)):
    return ":>"

@router.get("/connections")
def connections():
    return list_connections()

@router.get("/entities")
def entities():
    return list_entities()

@router.get("/tags")
def tags():
    return list_tags()