from fastapi import APIRouter, UploadFile, File
from .service import UploadService
from typing import List, Annotated
from pydantic import BaseModel
from core.types import APIResponce

class ArchiveRequest(BaseModel):
    archive: str


router = APIRouter()
service = UploadService()

@router.post("/")
async def upload_test(
    refreree: UploadFile = File(...),
    performance: UploadFile = File(...),
    assessments: UploadFile = File(...)
):
    ref = await refreree.read()
    perf = await performance.read()
    assess = await assessments.read()

    s = service.upload(ref, perf, assess)
    if not s:
        return APIResponce(status="error")
    return APIResponce(status="success")

@router.post("/switch")
def switch(req: ArchiveRequest):
    s = service.switch(req.archive)
    if not s:
        return APIResponce(status="error")
    return APIResponce(status="success")

@router.get("/archive")
def get_archive():
    arc = service.get_archive()
    if not arc:
        return APIResponce(status="error")
    return APIResponce(status="success", data=arc)


@router.post("/delete")
def delete_archive(req: ArchiveRequest):
    s = service.delete(req.archive)
    if not s:
        return APIResponce(status="error")
    return APIResponce(status="success")