
from fastapi import FastAPI
from app.db.mongodb import verificar_mongodb
from app.db.neo4j import verificar_neo4j
app = FastAPI(
    title="API - Proyecto 2 Bases de Datos",
    description="Sistema de análisis de pruebas específicas USAC",
    version="1.0.0"
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
