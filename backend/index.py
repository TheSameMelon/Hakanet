from fastapi import FastAPI
from sqlmodel import SQLModel

#from modules.register.route import router as registerRouter
#from modules.auth.route import router as authRouter
#from modules.entities.route import router as entityRouter
#from modules.tags.route import router as tagRouter
#from modules.debug.route import router as debugRouter
#from modules.profiles.route import router as profileRouter
from modules.assessments.route import router as AssessmentsRouter
from modules.referee.route import router as RefereeRouter
from modules.performances.route import router as PerformancesRouter
from modules.rating.route import router as DispersionRouter
from modules.upload.route import router as UploadRouter
from modules.competitions.route import router as CompetitionRouter

from modules.assessments.service import AssessmentService
from modules.referee.service import RefereeService
from modules.performances.service import PerformanceService
from modules.rating.service import DispersionService


from contextlib import asynccontextmanager
from data.database import engine
from fastapi.middleware.cors import CORSMiddleware
origins = [
    "http://127.0.0.1:3000",
    "http://localhost:3000"
]
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("START")
    yield
    print("CLOSE REQUEST")
    engine.dispose()
    print("CLOSED")



server = FastAPI(lifespan=lifespan)

server.add_middleware(CORSMiddleware, allow_origins=origins,allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

server.include_router(AssessmentsRouter, prefix="/assessments", tags=["Оценки"])
server.include_router(RefereeRouter, prefix="/referee", tags=["Судьи"])
server.include_router(PerformancesRouter, prefix="/performances", tags=["Выступления"])
server.include_router(DispersionRouter, prefix="/dispersion", tags=["Отклонения"])
server.include_router(UploadRouter, prefix="/upload", tags=["Загрузка"])
# server.include_router(CompetitionRouter, prefix="/competition", tags=["Соревнования"])


SQLModel.metadata.create_all(engine)

RefereeService().read()
AssessmentService().read()
PerformanceService().read()
DispersionService().calc_rating()