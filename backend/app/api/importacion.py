
import hashlib
import time
from pathlib import Path

from fastapi import APIRouter, File, UploadFile, HTTPException
from pymongo.errors import PyMongoError

from app.db.mongodb import db
from app.etl.load_mongodb import cargar_csv, DATA_DIR
from app.etl.load_neo4j import sincronizar_archivo


router = APIRouter(
    prefix="/api/importacion",
    tags=["Importación CSV"]
)

MAX_ARCHIVOS = 15
MAX_BYTES = 20 * 1024 * 1024


def hash_archivo(ruta: Path) -> str:
    calculo = hashlib.sha256()

    with ruta.open("rb") as archivo:
        for bloque in iter(
            lambda: archivo.read(1024 * 1024),
            b""
        ):
            calculo.update(bloque)

    return calculo.hexdigest()


def guardar_csv(contenido: bytes) -> str:
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    identificador = hashlib.sha256(
        contenido
    ).hexdigest()

    # Detectar archivos idénticos, aunque tengan otro nombre.
    for ruta in DATA_DIR.glob("*.csv"):
        if hash_archivo(ruta) == identificador:
            return ruta.name

    nombre = f"upload_{identificador}.csv"
    ruta = DATA_DIR / nombre

    ruta.write_bytes(contenido)

    return nombre


@router.post("/csv")
async def importar_csv(
    archivos: list[UploadFile] = File(...)
):
    if len(archivos) > MAX_ARCHIVOS:
        raise HTTPException(
            status_code=400,
            detail=f"Máximo {MAX_ARCHIVOS} archivos por solicitud"
        )

    resultados = []

    for archivo in archivos:
        inicio = time.perf_counter()
        nombre_original = archivo.filename or "sin_nombre"

        try:
            if not nombre_original.lower().endswith(".csv"):
                raise ValueError(
                    "El archivo debe tener extensión .csv"
                )

            contenido = await archivo.read(MAX_BYTES + 1)

            if len(contenido) > MAX_BYTES:
                raise ValueError(
                    "El archivo supera el límite de 20 MB"
                )

            if not contenido or not contenido.strip():
                raise ValueError("El archivo está vacío")

            if b"\x00" in contenido:
                raise ValueError(
                    "El archivo contiene bytes binarios inválidos y no es un CSV de texto"
                )

            # Validación y normalización de codificación (soporta UTF-8 y Latin-1/Windows-1252).
            try:
                contenido.decode("utf-8-sig")
            except UnicodeDecodeError:
                try:
                    texto_latin = contenido.decode("latin-1")
                    contenido = texto_latin.encode("utf-8")
                except UnicodeDecodeError:
                    raise ValueError(
                        "Codificación de texto no soportada (use UTF-8)"
                    )

            nombre_guardado = guardar_csv(contenido)

            resultado_mongo = cargar_csv(nombre_guardado)

            resultado_neo4j = sincronizar_archivo(
                nombre_guardado
            )

            resultados.append({
                "archivo_original": nombre_original,
                "archivo_guardado": nombre_guardado,
                "estado": "completado",
                "mongodb": resultado_mongo,
                "neo4j": resultado_neo4j,
                "duracion_total_segundos": round(
                    time.perf_counter() - inicio, 2
                )
            })

        except Exception as error:
            resultados.append({
                "archivo_original": nombre_original,
                "estado": "error",
                "mensaje": str(error),
                "duracion_total_segundos": round(
                    time.perf_counter() - inicio, 2
                )
            })

        finally:
            await archivo.close()

    return {
        "archivos_recibidos": len(archivos),
        "archivos_completados": sum(
            1 for r in resultados
            if r["estado"] == "completado"
        ),
        "resultados": resultados
    }


@router.get("/historial")
def obtener_historial_cargas():
    try:
        registros = list(
            db["historial_cargas"]
            .find({}, {"_id": 0})
            .sort("_id", -1)
            .limit(20)
        )
        return registros
    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Error al consultar el historial de cargas"
        )
