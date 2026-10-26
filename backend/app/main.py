
from fastapi import FastAPI
from app.db.mongodb import verificar_mongodb
from app.db.neo4j import verificar_neo4j
from app.api.estadisticas import router as estadisticas_router
from app.api.grafos import router as grafos_router
from fastapi import HTTPException
from pymongo.errors import PyMongoError
from neo4j.exceptions import Neo4jError, ServiceUnavailable, AuthError
from fastapi.middleware.cors import CORSMiddleware
from app.api.busqueda import router as busqueda_router


app = FastAPI(
    title="API - Proyecto 2 Bases de Datos",
    description="Sistema de análisis de pruebas específicas USAC",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)



@app.get("/")
def inicio():
    return {
        "mensaje": "API del Proyecto 2 funcionando",
        "estado": "activo"
    }



@app.get("/api/health/mongodb")
def estado_mongodb():
    try:
        verificar_mongodb()

        return {
            "database": "MongoDB",
            "status": "connected"
        }

    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="No se pudo conectar con MongoDB"
        )


@app.get("/api/health/neo4j")
def estado_neo4j():
    try:
        verificar_neo4j()

        return {
            "database": "Neo4j",
            "status": "connected"
        }

    except (Neo4jError, ServiceUnavailable, AuthError):
        raise HTTPException(
            status_code=503,
            detail="No se pudo conectar con Neo4j"
        )


app.include_router(estadisticas_router)
app.include_router(grafos_router)
app.include_router(busqueda_router)