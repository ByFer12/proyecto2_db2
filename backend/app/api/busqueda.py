
from fastapi import APIRouter, Query, HTTPException
from pymongo.errors import PyMongoError

from app.services.busqueda import buscar_evaluaciones


router = APIRouter(
    prefix="/api/busqueda",
    tags=["Buscador de evaluaciones"]
)


@router.get("/evaluaciones")
def obtener_evaluaciones(
    correlativo: str | None = None,
    materia: str | None = None,
    carrera: str | None = None,
    sexo: str | None = None,
    institucion: str | None = None,
    municipio: str | None = None,
    departamento: str | None = None,
    anio: int | None = Query(default=None, ge=2015, le=2024),
    aprobado: bool | None = None,
    pagina: int = Query(default=1, ge=1),
    limite: int = Query(default=20, ge=1, le=100)
):
    try:
        return buscar_evaluaciones(
            correlativo=correlativo,
            materia=materia,
            carrera=carrera,
            sexo=sexo,
            institucion=institucion,
            municipio=municipio,
            departamento=departamento,
            anio=anio,
            aprobado=aprobado,
            pagina=pagina,
            limite=limite
        )

    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Error al consultar MongoDB"
        )
