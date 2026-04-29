from fastapi import APIRouter, UploadFile, File
from .service import UploadService
from typing import List, Annotated
from pydantic import BaseModel

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

    service.upload(ref, perf, assess)

@router.post("/switch")
def switch(req: ArchiveRequest):
    service.switch(req.archive)

