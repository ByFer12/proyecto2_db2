
from fastapi import APIRouter, HTTPException, Query
from neo4j.exceptions import Neo4jError, ServiceUnavailable

from app.services.grafos import (
    aprobaciones_por_materia,
    aspirantes_por_departamento,
    historial_aspirante_grafo,
    carreras_por_departamento,
    desempeno_por_intentos,
    visualizar_grafo_aspirante,
    obtener_aspirantes_sugeridos,
    obtener_opciones_filtros_grafo,
    explorar_grafo_general,
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



@router.get("/aspirantes-sugeridos")
def listar_aspirantes_sugeridos(
    limite: int = Query(default=12, ge=1, le=50),
    busqueda: str | None = None,
):
    try:
        return obtener_aspirantes_sugeridos(
            limite=limite,
            busqueda=busqueda,
        )
    except (Neo4jError, ServiceUnavailable):
        raise HTTPException(
            status_code=503,
            detail="Error al consultar aspirantes sugeridos en Neo4j"
        )


@router.get("/filtros-opciones")
def listar_opciones_filtros_grafo():
    try:
        return obtener_opciones_filtros_grafo()
    except (Neo4jError, ServiceUnavailable):
        raise HTTPException(
            status_code=503,
            detail="Error al consultar opciones de filtros en Neo4j"
        )


@router.get("/explorar-red")
def obtener_exploracion_red(
    carrera: str | None = None,
    departamento: str | None = None,
    materia: str | None = None,
    anio_ingreso: int | None = None,
    aprobado: bool | None = None,
    limite: int = Query(default=30, ge=5, le=100),
):
    try:
        return explorar_grafo_general(
            carrera=carrera,
            departamento=departamento,
            materia=materia,
            anio_ingreso=anio_ingreso,
            aprobado=aprobado,
            limite=limite,
        )
    except (Neo4jError, ServiceUnavailable):
        raise HTTPException(
            status_code=503,
            detail="Error al explorar la red en Neo4j"
        )


@router.get("/visualizar/{correlativo}")
def obtener_visualizacion_grafo(
    correlativo: str,
    aprobado: bool | None = None,
    materia: str | None = None,
    anio_ingreso: int | None = None,
    intento: int | None = None,
    incluir_contexto: bool = True,
):
    try:
        resultado = visualizar_grafo_aspirante(
            correlativo=correlativo,
            aprobado=aprobado,
            materia=materia,
            anio_ingreso=anio_ingreso,
            intento=intento,
            incluir_contexto=incluir_contexto,
        )

        if not resultado["nodes"]:
            raise HTTPException(
                status_code=404,
                detail="Aspirante no encontrado o sin resultados para los filtros aplicados"
            )

        return resultado

    except (Neo4jError, ServiceUnavailable):
        raise HTTPException(
            status_code=503,
            detail="Error al generar la visualización del grafo"
        )
