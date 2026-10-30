
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pymongo.errors import PyMongoError

from app.services.estadisticas import (
    aspirantes_por_institucion,
    aprobados_por_materia,
    aprobados_por_carrera_anio,
    porcentaje_aprobacion_materia,
    promedio_edad_carrera,
    generar_resumen_carrera,
    promedio_edad_aprobados_carrera_institucion,
    aprobados_por_municipio_carrera,
    evaluaciones_mensuales_instituciones_publicas,
    top_carreras_aspirantes_jovenes,
    historial_desempeno_aspirante,
    distribucion_sexo_institucion,
    tasa_aprobacion_por_edad,
    promedio_intentos_por_materia,
    historial_completo_aspirante,
    carreras_reprobados_primer_intento,
    top_municipios_aspirantes,
    tasa_aprobacion_institucion,
    carreras_demandadas_departamento,
    evolucion_aprobacion_anual,
    ejecutar_consulta_mongo_personalizada,
)


class SolicitudConsultaMongo(BaseModel):
    coleccion: str = "evaluaciones"
    modo: str = "aggregate"
    consulta: list | dict
    limite: int = 100

router = APIRouter(
    prefix="/api/estadisticas",
    tags=["Estadísticas MongoDB"]
)

@router.get("/aspirantes-institucion")
def obtener_aspirantes_por_institucion():
    try:
        return aspirantes_por_institucion()

    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Error al consultar MongoDB"
        )

@router.get("/aprobados-materia")
def obtener_aprobados_por_materia():
    try:
        return aprobados_por_materia()

    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Error al consultar aprobados por materia"
        )

@router.get("/aprobados-carrera-anio")
def obtener_aprobados_por_carrera_anio():
    try:
        return aprobados_por_carrera_anio()

    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Error al consultar aprobados por carrera y año"
        )

@router.get("/porcentaje-aprobacion-materia")
def obtener_porcentaje_aprobacion_materia():
    try:
        return porcentaje_aprobacion_materia()

    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Error al calcular porcentajes de aprobación"
        )

@router.get("/promedio-edad-carrera")
def obtener_promedio_edad_carrera():
    try:
        return promedio_edad_carrera()

    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Error al calcular la edad promedio por carrera"
        )

@router.post("/generar-resumen-carrera")
def crear_resumen_carrera():
    try:
        return generar_resumen_carrera()

    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Error al generar resumen por carrera"
        )

@router.get("/promedio-edad-aprobados-carrera-institucion")
def obtener_promedio_edad_aprobados_carrera_institucion():
    try:
        return promedio_edad_aprobados_carrera_institucion()

    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Error al calcular edad promedio de aprobados"
        )

@router.get("/aprobados-municipio-carrera")
def obtener_aprobados_municipio_carrera():
    try:
        return aprobados_por_municipio_carrera()

    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Error al consultar aprobados por municipio y carrera"
        )

@router.get("/evaluaciones-mensuales-publicas")
def obtener_evaluaciones_mensuales_publicas():
    try:
        return evaluaciones_mensuales_instituciones_publicas()

    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Error al consultar evaluaciones mensuales"
        )

@router.get("/top-carreras-jovenes")
def obtener_top_carreras_jovenes():
    try:
        return top_carreras_aspirantes_jovenes()

    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Error al consultar carreras más demandadas"
        )

@router.get("/historial-desempeno/{correlativo}")
def obtener_historial_desempeno(correlativo: str):
    try:
        resultados = historial_desempeno_aspirante(
            correlativo
        )

        if not resultados:
            raise HTTPException(
                status_code=404,
                detail="No se encontraron evaluaciones para el aspirante"
            )

        return resultados

    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Error al consultar historial del aspirante"
        )

@router.get("/distribucion-sexo-institucion")
def obtener_distribucion_sexo_institucion():
    try:
        return distribucion_sexo_institucion()

    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Error al consultar distribución por sexo e institución"
        )

@router.get("/tasa-aprobacion-edad")
def obtener_tasa_aprobacion_edad():
    try:
        return tasa_aprobacion_por_edad()

    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Error al calcular tasa de aprobación por edad"
        )

@router.get("/historial-completo/{correlativo}")
def obtener_historial_completo(correlativo: str):
    try:
        resultados = historial_completo_aspirante(
            correlativo
        )

        if not resultados:
            raise HTTPException(
                status_code=404,
                detail="Aspirante no encontrado"
            )

        return {
            "correlativo_aspirante": correlativo,
            "total_evaluaciones": len(resultados),
            "evaluaciones": resultados
        }

    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Error al consultar el historial completo"
        )

@router.get("/promedio-intentos-materia")
def obtener_promedio_intentos_materia():
    try:
        return promedio_intentos_por_materia()

    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Error al calcular promedio de intentos"
        )

@router.get("/carreras-reprobados-primer-intento")
def obtener_carreras_reprobados_primer_intento():
    try:
        return carreras_reprobados_primer_intento()

    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Error al consultar reprobados en primer intento"
        )

@router.get("/top-municipios-aspirantes")
def obtener_top_municipios_aspirantes():
    try:
        return top_municipios_aspirantes()

    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Error al consultar municipios con más aspirantes"
        )


@router.get("/tasa-aprobacion-institucion")
def obtener_tasa_aprobacion_institucion():
    try:
        return tasa_aprobacion_institucion()

    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Error al calcular tasa de aprobación por institución"
        )


@router.get("/carreras-demandadas-departamento")
def obtener_carreras_demandadas_departamento():
    try:
        return carreras_demandadas_departamento()

    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Error al consultar carreras por departamento"
        )


@router.get("/evolucion-aprobacion-anual")
def obtener_evolucion_aprobacion_anual():
    try:
        return evolucion_aprobacion_anual()

    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Error al consultar evolución anual"
        )


@router.post("/consulta-personalizada")
def post_consulta_personalizada(payload: SolicitudConsultaMongo):
    try:
        return ejecutar_consulta_mongo_personalizada(
            coleccion_nombre=payload.coleccion,
            modo=payload.modo,
            consulta=payload.consulta,
            limite=payload.limite,
        )
    except ValueError as err:
        raise HTTPException(
            status_code=400,
            detail=str(err)
        )
    except PyMongoError as err:
        raise HTTPException(
            status_code=400,
            detail=f"Error en consulta MongoDB: {err}"
        )
