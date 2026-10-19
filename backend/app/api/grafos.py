
from fastapi import APIRouter, HTTPException
from neo4j.exceptions import Neo4jError

#from app.services.grafos import aprobaciones_por_materia

from app.services.grafos import (
    aprobaciones_por_materia,
    aspirantes_por_departamento,
    historial_aspirante_grafo,
    carreras_por_departamento,
    desempeno_por_intentos
)

router = APIRouter(
    prefix="/api/grafos",
    tags=["Consultas Neo4j"]
)


@router.get("/aprobaciones-materia")
def obtener_aprobaciones_materia():
    try:
        return aprobaciones_por_materia()

    except Neo4jError:
        raise HTTPException(
            status_code=503,
            detail="Error al consultar Neo4j"
        )


from neo4j.exceptions import ServiceUnavailable


@router.get("/aspirantes-departamento")
def obtener_aspirantes_departamento():
    try:
        return aspirantes_por_departamento()
    except (Neo4jError, ServiceUnavailable):
        raise HTTPException(
            status_code=503,
            detail="Error al consultar departamentos en Neo4j"
        )


@router.get("/historial/{correlativo}")
def obtener_historial_grafo(correlativo: str):
    try:
        resultados = historial_aspirante_grafo(correlativo)

        if not resultados:
            raise HTTPException(
                status_code=404,
                detail="Aspirante no encontrado"
            )

        return resultados
    except (Neo4jError, ServiceUnavailable):
        raise HTTPException(
            status_code=503,
            detail="Error al consultar historial en Neo4j"
        )


@router.get("/carreras-departamento")
def obtener_carreras_departamento():
    try:
        return carreras_por_departamento()
    except (Neo4jError, ServiceUnavailable):
        raise HTTPException(
            status_code=503,
            detail="Error al consultar carreras en Neo4j"
        )


@router.get("/desempeno-intentos")
def obtener_desempeno_intentos():
    try:
        return desempeno_por_intentos()
    except (Neo4jError, ServiceUnavailable):
        raise HTTPException(
            status_code=503,
            detail="Error al consultar intentos en Neo4j"
        )
