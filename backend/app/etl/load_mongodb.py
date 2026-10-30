
import csv
import hashlib
import sys
import time
from pathlib import Path

from pymongo import UpdateOne
from pymongo.errors import PyMongoError

from app.db.mongodb import db, client
from app.etl.transform import transformar_registro, EQUIVALENCIAS


BASE_DIR = Path(__file__).resolve().parents[3]
DATA_DIR = BASE_DIR / "data" / "raw"

BATCH_SIZE = 500
COLUMNAS_REQUERIDAS = {
    "correlativo_aspirante",
    "fecha_asignacion",
    "materia",
    "aprobacion",
    "anio_de_ingreso",
    "numero_de_fecha_de_evaluacion",
}


def cargar_csv(nombre_archivo):
    ruta = DATA_DIR / nombre_archivo

    if not ruta.is_file():
        raise FileNotFoundError(
            f"No existe el archivo: {ruta}"
        )

    coleccion = db["evaluaciones"]

    # Cada fila tendrá un identificador estable.
    coleccion.create_index(
        "id_registro",
        unique=True
    )

    total = 0
    validos = 0
    rechazados = 0
    operaciones = []
    errores = []

    inicio = time.perf_counter()

    def guardar_lote():
        if operaciones:
            coleccion.bulk_write(
                operaciones,
                ordered=False
            )
            operaciones.clear()

    with ruta.open(
        "r",
        encoding="utf-8-sig",
        errors="replace",
        newline=""
    ) as archivo:
        primera_linea = archivo.readline()
        if not primera_linea or not primera_linea.strip():
            raise ValueError("El archivo CSV no contiene encabezados válidos")

        delimitador = (
            ";"
            if primera_linea.count(";") > primera_linea.count(",")
            else ","
        )
        archivo.seek(0)

        lector = csv.DictReader(archivo, delimiter=delimitador)

        if not lector.fieldnames:
            raise ValueError("No se pudieron detectar las columnas del archivo CSV")

        encabezados_normalizados = {
            EQUIVALENCIAS.get(c.strip().lower(), c.strip().lower())
            for c in lector.fieldnames
            if isinstance(c, str) and c.strip()
        }

        faltantes = COLUMNAS_REQUERIDAS - encabezados_normalizados
        if faltantes:
            raise ValueError(
                "Estructura de columnas inválida. Faltan columnas requeridas: "
                + ", ".join(sorted(faltantes))
            )

        numero_fila = 1
        while True:
            try:
                fila = next(lector)
            except StopIteration:
                break
            except csv.Error as err_csv:
                numero_fila += 1
                total += 1
                rechazados += 1
                errores.append({
                    "archivo": nombre_archivo,
                    "fila": numero_fila,
                    "motivo": f"Formato CSV malformado en la fila: {err_csv}"
                })
                continue

            numero_fila += 1
            total += 1

            try:
                documento = transformar_registro(fila)

                # Identificador reproducible por archivo y fila.
                identificador = hashlib.sha256(
                    f"{nombre_archivo}:{numero_fila}".encode()
                ).hexdigest()

                documento["id_registro"] = identificador
                documento["archivo_origen"] = nombre_archivo
                documento["fila_origen"] = numero_fila

                operaciones.append(
                    UpdateOne(
                        {"id_registro": identificador},
                        {"$set": documento},
                        upsert=True
                    )
                )

                validos += 1

                if len(operaciones) >= BATCH_SIZE:
                    guardar_lote()

            except (ValueError, TypeError, AttributeError, KeyError) as error:
                rechazados += 1
                errores.append({
                    "archivo": nombre_archivo,
                    "fila": numero_fila,
                    "motivo": str(error)
                })

    if total == 0:
        raise ValueError("El archivo CSV solo tiene encabezados y no contiene registros")

    guardar_lote()

    if errores:
        db["errores_carga"].insert_many(
            [error.copy() for error in errores[:1000]]
        )

    duracion = round(
        time.perf_counter() - inicio, 2
    )

    resultado = {
        "archivo": nombre_archivo,
        "total": total,
        "validos": validos,
        "rechazados": rechazados,
        "duracion_segundos": duracion,
        "estado": "completado",
        "errores": errores[:20]
    }

    db["historial_cargas"].insert_one(
        resultado.copy()
    )

    return resultado


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(
            "Uso: python -m app.etl.load_mongodb "
            "<archivo.csv>"
        )
        sys.exit(1)

    try:
        resultado = cargar_csv(sys.argv[1])

        for clave, valor in resultado.items():
            print(f"{clave}: {valor}")

    except (PyMongoError, OSError) as error:
        print(f"Error durante la carga: {error}")
        sys.exit(1)

    finally:
        client.close()
