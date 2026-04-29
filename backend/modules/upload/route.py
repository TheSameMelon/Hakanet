from fastapi import APIRouter, UploadFile, File
from .service import UploadService
from typing import List, Annotated

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
